import path from 'path';
import express from 'express';
const router = express.Router();
import multer from 'multer';
import XLSX from 'xlsx';
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineCaseStep from '../../models/caseSteps.js';
import defineFolder from '../../models/folders.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { priorities, testTypes, automationStatus, templates } from '../../config/enums.js';

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.xlsx', '.xls'];
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const extname = allowedFileTypes.includes(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed!'));
  }
};

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

export default function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  Case.belongsToMany(Step, { through: CaseStep });
  Step.belongsToMany(Case, { through: CaseStep });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(sequelize);

  router.post(
    '/import',
    (req, res, next) => {
      upload.single('file')(req, res, function (err) {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    verifySignedIn,
    verifyProjectDeveloperFromFolderId,
    async (req, res) => {
      const { folderId } = req.query;

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!folderId) {
        return res.status(400).json({ error: 'folderId is required' });
      }

      const t = await sequelize.transaction();
      try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;

        if (sheetNames.length === 0) {
          return res.status(400).json({ error: 'Excel file contains no sheets' });
        }

        // Look up parent folder's projectId once (needed for folder creation)
        let projectId = null;
        const parentFolder = await Folder.findByPk(folderId);
        if (parentFolder) {
          projectId = parentFolder.projectId;
        }

        const allCasesToCreate = [];
        const allStepsToCreate = [];
        const multiSheet = sheetNames.length > 1;

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            if (!multiSheet) {
              return res.status(400).json({ error: 'Excel file contains no data rows' });
            }
            continue; // skip empty sheets in multi-sheet mode
          }

          // Determine the target folder for this sheet's cases
          let sheetFolderId = folderId;
          if (multiSheet) {
            if (!projectId) {
              await t.rollback();
              return res.status(404).json({ error: 'Parent folder not found' });
            }
            const [sheetFolder] = await Folder.findOrCreate({
              where: { name: sheetName, parentFolderId: folderId, projectId },
              defaults: { name: sheetName, parentFolderId: folderId, projectId },
              transaction: t,
            });
            sheetFolderId = sheetFolder.id;
          }

          // Detect format based on header columns
          const headers = Object.keys(jsonData[0]);
          const isReferenceFormat = headers.some((h) => ['Test Steps', 'Test Scenario', 'Test Case ID'].includes(h));

          let casesToCreate;
          let stepsToCreate;
          const caseOffset = allCasesToCreate.length;

          if (isReferenceFormat) {
            let modules;
            ({ casesToCreate, stepsToCreate, modules } = _parseReferenceFormat(jsonData, sheetFolderId, res));
            if (!casesToCreate) return; // validation error already sent

            // Create sub-folders from Module column if any modules exist
            if (modules && modules.some((m) => m !== null)) {
              if (!projectId) {
                await t.rollback();
                return res.status(404).json({ error: 'Parent folder not found' });
              }
              const uniqueModules = [...new Set(modules.filter((m) => m !== null))];
              const moduleFolderMap = {};

              for (const moduleName of uniqueModules) {
                const [folder] = await Folder.findOrCreate({
                  where: { name: moduleName, parentFolderId: sheetFolderId, projectId },
                  defaults: { name: moduleName, parentFolderId: sheetFolderId, projectId },
                  transaction: t,
                });
                moduleFolderMap[moduleName] = folder.id;
              }

              // Assign each case to its module folder
              casesToCreate.forEach((c, i) => {
                if (modules[i] && moduleFolderMap[modules[i]]) {
                  c.folderId = moduleFolderMap[modules[i]];
                }
              });
            }
          } else {
            ({ casesToCreate, stepsToCreate } = _parseV1Format(jsonData, sheetFolderId, res));
            if (!casesToCreate) return; // validation error already sent
          }

          // Offset step caseIndex references for accumulated array
          for (const step of stepsToCreate) {
            step.caseIndex += caseOffset;
          }

          allCasesToCreate.push(...casesToCreate);
          allStepsToCreate.push(...stepsToCreate);
        }

        if (allCasesToCreate.length === 0) {
          return res.status(400).json({ error: 'Excel file contains no data rows' });
        }

        // 'Manually' create cases, steps and caseStep association.
        const createdCases = await Case.bulkCreate(allCasesToCreate, { transaction: t });
        for (const stepData of allStepsToCreate) {
          const createdCase = createdCases[stepData.caseIndex];
          const createdStep = await Step.create(
            {
              step: stepData.step,
              result: stepData.result,
            },
            { transaction: t }
          );
          await CaseStep.create(
            {
              caseId: createdCase.id,
              stepId: createdStep.id,
              stepNo: stepData.stepNo,
            },
            { transaction: t }
          );
        }

        await t.commit();
        res.json(createdCases);
      } catch (error) {
        await t.rollback();
        console.error(error);
      }
    }
  );

  return router;
}

function _getRowValidationError(row, index) {
  const requiredFields = ['title', 'priority', 'type', 'template'];
  const rowNumber = index + 2;

  for (const field of requiredFields) {
    if (!row[field]) {
      return `Row ${rowNumber} is missing required field: ${field}`;
    }
  }

  // Validate priority if provided
  if (row['priority']) {
    const priorityIndex = priorities.indexOf(row['priority']?.toLowerCase());
    if (priorityIndex === -1) {
      return `Row ${rowNumber} has invalid priority: ${row['priority']}`;
    }
  }

  // Validate type if provided
  if (row['type']) {
    const typeIndex = testTypes.indexOf(row['type']?.toLowerCase());
    if (typeIndex === -1) {
      return `Row ${rowNumber} has invalid type: ${row['type']}`;
    }
  }

  // Validate automationStatus if provided
  if (row['automationStatus']) {
    const automationStatusIndex = automationStatus.indexOf(row['automationStatus']?.toLowerCase());
    if (automationStatusIndex === -1) {
      return `Row ${rowNumber} has invalid automationStatus: ${row['automationStatus']}`;
    }
  }

  // Validate template if provided
  if (row['template']) {
    const templateIndex = templates.indexOf(row['template']?.toLowerCase());
    if (templateIndex === -1) {
      return `Row ${rowNumber} has invalid template: ${row['template']}`;
    }
  }

  return null;
}

// Parse v1.1 format: each row is a step, cases grouped by repeated title
function _parseV1Format(jsonData, folderId, res) {
  let currentTitle = null;
  let previousTitle = null;
  let stepNo = 1;
  const casesToCreate = [];
  const stepsToCreate = [];

  for (const [index, row] of jsonData.entries()) {
    const errorMessage = _getRowValidationError(row, index);
    if (errorMessage) {
      res.status(400).json({ error: errorMessage });
      return { casesToCreate: null, stepsToCreate: null };
    }

    currentTitle = row['title'].trim();
    previousTitle = casesToCreate[casesToCreate.length - 1]?.title.trim();
    if (casesToCreate.length > 0 && previousTitle === currentTitle) {
      stepNo += 1;
      stepsToCreate.push({
        caseIndex: casesToCreate.length - 1,
        stepNo: stepNo,
        step: row['step'] || '',
        result: row['expectedStepResult'] || '',
      });
    } else {
      stepNo = 1;
      casesToCreate.push({
        folderId: folderId,
        title: currentTitle,
        description: row['description'] || '',
        state: 0,
        priority: row['priority'] ? priorities.indexOf(row['priority']) : priorities.indexOf('medium'),
        type: row['type'] ? testTypes.indexOf(row['type']) : testTypes.indexOf('other'),
        preConditions: row['preConditions'],
        expectedResults: row['expectedResults'],
        automationStatus: row['automationStatus']
          ? automationStatus.indexOf(row['automationStatus'])
          : automationStatus.indexOf('automation-not-required'),
        template: row['template'] ? templates.indexOf(row['template']) : templates.indexOf('text'),
      });
      stepsToCreate.push({
        caseIndex: casesToCreate.length - 1,
        stepNo: stepNo,
        step: row['step'] || '',
        result: row['expectedStepResult'] || '',
      });
    }
  }

  return { casesToCreate, stepsToCreate };
}

// Parse reference format: each row is one test case, steps are newline-separated in a single cell
function _parseReferenceFormat(jsonData, folderId, res) {
  const casesToCreate = [];
  const stepsToCreate = [];
  const modules = [];

  for (const [index, row] of jsonData.entries()) {
    const rowNumber = index + 2;
    const title = row['Test Scenario'] || row['title'];
    if (!title) {
      res.status(400).json({ error: `Row ${rowNumber} is missing required field: Test Scenario` });
      return { casesToCreate: null, stepsToCreate: null };
    }

    // Map priority from reference format (case-insensitive match)
    const rawPriority = (row['Priority'] || row['priority'] || 'medium').toString().toLowerCase();
    let priorityIndex = priorities.indexOf(rawPriority);
    if (priorityIndex === -1) {
      priorityIndex = priorities.indexOf('medium');
    }

    // Map type from reference format
    const rawType = (row['Type'] || row['type'] || 'other').toString().toLowerCase();
    let typeIndex = testTypes.indexOf(rawType);
    if (typeIndex === -1) {
      typeIndex = testTypes.indexOf('other');
    }

    // Build description from available metadata fields
    const descParts = [];
    if (row['Test Case ID']) descParts.push(`Test Case ID: ${row['Test Case ID']}`);
    if (row['Module']) descParts.push(`Module: ${row['Module']}`);
    if (row['Test Data']) descParts.push(`Test Data: ${row['Test Data']}`);
    if (row['Comments']) descParts.push(`Comments: ${row['Comments']}`);
    if (row['description']) descParts.push(row['description']);
    const description = descParts.join('\n') || '';

    // Parse test steps from newline-separated cell
    const rawSteps = (row['Test Steps'] || row['step'] || '').toString();
    const parsedSteps = _parseMultilineSteps(rawSteps);
    const hasSteps = parsedSteps.length > 0 && parsedSteps.some((s) => s.trim() !== '');

    // Determine template: use 'step' if there are parsed steps, otherwise 'text'
    const rawTemplate = (row['template'] || '').toString().toLowerCase();
    let templateIndex;
    if (rawTemplate && templates.indexOf(rawTemplate) !== -1) {
      templateIndex = templates.indexOf(rawTemplate);
    } else {
      templateIndex = hasSteps ? templates.indexOf('step') : templates.indexOf('text');
    }

    // Track module name for folder creation
    modules.push(row['Module'] ? row['Module'].toString().trim() : null);

    casesToCreate.push({
      folderId: folderId,
      title: title.trim(),
      description: description,
      state: 0,
      priority: priorityIndex,
      type: typeIndex,
      preConditions: row['Pre - Condition'] || row['preConditions'] || '',
      expectedResults: row['Expected Result'] || row['expectedResults'] || '',
      automationStatus: row['automationStatus']
        ? automationStatus.indexOf(row['automationStatus'])
        : automationStatus.indexOf('automation-not-required'),
      template: templateIndex,
    });

    const caseIndex = casesToCreate.length - 1;
    if (hasSteps) {
      parsedSteps.forEach((stepText, stepIdx) => {
        stepsToCreate.push({
          caseIndex: caseIndex,
          stepNo: stepIdx + 1,
          step: stepText.trim(),
          result: '',
        });
      });
    } else {
      // Add a single empty step placeholder
      stepsToCreate.push({
        caseIndex: caseIndex,
        stepNo: 1,
        step: '',
        result: '',
      });
    }
  }

  return { casesToCreate, stepsToCreate, modules };
}

// Parse multiline steps from a single cell value
// Handles formats like: "1. Step one\n2. Step two\n3. Step three"
// or plain lines separated by newlines
function _parseMultilineSteps(rawText) {
  if (!rawText || rawText.trim() === '') return [];

  const lines = rawText.split(/\n/).filter((line) => line.trim() !== '');

  // Check if lines are numbered (e.g., "1. Step one", "2. Step two")
  const numberedPattern = /^\d+[\.\)]\s*/;
  const allNumbered = lines.length > 0 && lines.every((line) => numberedPattern.test(line.trim()));

  if (allNumbered) {
    // Strip the numbering prefix from each line
    return lines.map((line) => line.trim().replace(numberedPattern, '').trim());
  }

  // Return lines as-is (each line is a separate step)
  return lines.map((line) => line.trim());
}
