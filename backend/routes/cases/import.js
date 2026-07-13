import path from 'path';
import express from 'express';
const router = express.Router();
import multer from 'multer';
import XLSX from 'xlsx';
import { DataTypes, Op } from 'sequelize';
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
  Case.belongsTo(Folder, { foreignKey: 'folderId' });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(sequelize);

  const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };

  // Shared by preview and commit: parse every non-empty sheet in the workbook,
  // flag duplicate Test Case IDs, and resolve new/update against existing cases.
  // Read-only (aside from the project lookup needed to resolve matches).
  const buildSheetsFromWorkbook = async (buffer, parentFolder) => {
    const projectId = parentFolder.projectId;
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return { error: 'Excel file contains no sheets' };
    }

    const nonEmptySheetNames = sheetNames.filter((name) => {
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
      return jsonData.length > 0;
    });
    if (nonEmptySheetNames.length === 0) {
      return { error: 'Excel file contains no data rows' };
    }
    const multiSheet = nonEmptySheetNames.length > 1;

    const sheets = [];
    for (const sheetName of nonEmptySheetNames) {
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const headers = Object.keys(jsonData[0]);
      const isReferenceFormat = headers.some((h) => ['Test Steps', 'Test Scenario', 'Test Case ID'].includes(h));

      const cases = isReferenceFormat ? _parseReferenceFormat(jsonData) : _parseV1Format(jsonData);

      sheets.push({
        sheetName,
        targetFolderName: multiSheet ? sheetName : parentFolder.name,
        cases,
      });
    }

    _flagDuplicateExternalIds(sheets);
    await _resolveNewVsUpdate(sheets, Case, Folder, projectId);

    return { multiSheet, sheets };
  };

  // Preview: parse and validate every sheet, resolve new/update against existing
  // cases in the project, but write nothing to the database.
  router.post('/import/preview', handleUpload, verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const { folderId } = req.query;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const parentFolder = await Folder.findByPk(folderId);
      if (!parentFolder) {
        return res.status(404).json({ error: 'Parent folder not found' });
      }

      const result = await buildSheetsFromWorkbook(req.file.buffer, parentFolder);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      const responseSheets = result.sheets.map((sheet) => ({
        sheetName: sheet.sheetName,
        targetFolderName: sheet.targetFolderName,
        summary: {
          total: sheet.cases.length,
          new: sheet.cases.filter((c) => c.status === 'new').length,
          update: sheet.cases.filter((c) => c.status === 'update').length,
          failed: sheet.cases.filter((c) => c.status === 'error').length,
        },
        cases: sheet.cases,
      }));

      res.json({ multiSheet: result.multiSheet, sheets: responseSheets });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Commit: re-uploads the same file and re-runs the same parsing/matching as
  // preview (rather than trusting a client-echoed payload, which both avoids
  // request-size limits on large workbooks and guarantees the data written is
  // exactly what the file says). `includedSheets` names which sheets to keep.
  router.post('/import/commit', handleUpload, verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const { folderId } = req.query;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let includedSheets;
    try {
      includedSheets = JSON.parse(req.body.includedSheets || '[]');
    } catch {
      return res.status(400).json({ error: 'includedSheets must be a JSON array of sheet names' });
    }
    if (!Array.isArray(includedSheets) || includedSheets.length === 0) {
      return res.status(400).json({ error: 'No sheets to import' });
    }

    const t = await sequelize.transaction();
    try {
      const parentFolder = await Folder.findByPk(folderId, { transaction: t });
      if (!parentFolder) {
        await t.rollback();
        return res.status(404).json({ error: 'Parent folder not found' });
      }
      const projectId = parentFolder.projectId;

      const result = await buildSheetsFromWorkbook(req.file.buffer, parentFolder);
      if (result.error) {
        await t.rollback();
        return res.status(400).json({ error: result.error });
      }
      const { multiSheet, sheets: allSheets } = result;
      const sheets = allSheets.filter((sheet) => includedSheets.includes(sheet.sheetName));
      if (sheets.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'No sheets to import' });
      }

      let createdCount = 0;
      let updatedCount = 0;

      for (const sheet of sheets) {
        let sheetFolderId = folderId;
        if (multiSheet) {
          const [sheetFolder] = await Folder.findOrCreate({
            where: { name: sheet.sheetName, parentFolderId: folderId, projectId },
            defaults: { name: sheet.sheetName, parentFolderId: folderId, projectId },
            transaction: t,
          });
          sheetFolderId = sheetFolder.id;
        }

        const importableCases = (sheet.cases || []).filter((c) => c.status === 'new' || c.status === 'update');

        const moduleNames = [...new Set(importableCases.filter((c) => c.module).map((c) => c.module))];
        const moduleFolderMap = {};
        for (const moduleName of moduleNames) {
          const [moduleFolder] = await Folder.findOrCreate({
            where: { name: moduleName, parentFolderId: sheetFolderId, projectId },
            defaults: { name: moduleName, parentFolderId: sheetFolderId, projectId },
            transaction: t,
          });
          moduleFolderMap[moduleName] = moduleFolder.id;
        }

        for (const c of importableCases) {
          const targetFolderId = c.module && moduleFolderMap[c.module] ? moduleFolderMap[c.module] : sheetFolderId;
          const caseFields = {
            folderId: targetFolderId,
            title: c.title,
            description: c.description || '',
            state: 0,
            priority: c.priority,
            type: c.type,
            preConditions: c.preConditions || '',
            expectedResults: c.expectedResults || '',
            automationStatus: c.automationStatus,
            template: c.template,
            externalId: c.externalId || null,
          };

          let caseId;
          if (c.status === 'update' && c.matchedCaseId) {
            await Case.update(caseFields, { where: { id: c.matchedCaseId }, transaction: t });
            caseId = c.matchedCaseId;

            const existingCaseSteps = await CaseStep.findAll({ where: { caseId }, transaction: t });
            const stepIds = existingCaseSteps.map((cs) => cs.stepId);
            await CaseStep.destroy({ where: { caseId }, transaction: t });
            if (stepIds.length > 0) {
              await Step.destroy({ where: { id: stepIds }, transaction: t });
            }
            updatedCount += 1;
          } else {
            const created = await Case.create(caseFields, { transaction: t });
            caseId = created.id;
            createdCount += 1;
          }

          for (const step of c.steps || []) {
            const createdStep = await Step.create({ step: step.step, result: step.result }, { transaction: t });
            await CaseStep.create({ caseId, stepId: createdStep.id, stepNo: step.stepNo }, { transaction: t });
          }
        }
      }

      await t.commit();
      res.status(200).json({ created: createdCount, updated: updatedCount });
    } catch (error) {
      await t.rollback();
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

function _getRowValidationError(row, rowNumber) {
  const requiredFields = ['title', 'priority', 'type', 'template'];

  for (const field of requiredFields) {
    if (!row[field]) {
      return `Row ${rowNumber} is missing required field: ${field}`;
    }
  }

  if (row['priority']) {
    const priorityIndex = priorities.indexOf(row['priority']);
    if (priorityIndex === -1) {
      return `Row ${rowNumber} has invalid priority: ${row['priority']}`;
    }
  }

  if (row['type']) {
    const typeIndex = testTypes.indexOf(row['type']);
    if (typeIndex === -1) {
      return `Row ${rowNumber} has invalid type: ${row['type']}`;
    }
  }

  if (row['automationStatus']) {
    const automationStatusIndex = automationStatus.indexOf(row['automationStatus']);
    if (automationStatusIndex === -1) {
      return `Row ${rowNumber} has invalid automationStatus: ${row['automationStatus']}`;
    }
  }

  if (row['template']) {
    const templateIndex = templates.indexOf(row['template']);
    if (templateIndex === -1) {
      return `Row ${rowNumber} has invalid template: ${row['template']}`;
    }
  }

  return null;
}

// Parse v1.1 format: each row is a step, cases grouped by repeated title.
// Returns one entry per case (row-group), each either a parsed case or an error.
function _parseV1Format(jsonData) {
  const groups = [];
  let currentGroup = null;

  jsonData.forEach((row, index) => {
    const rowNumber = index + 2;
    const title = (row['title'] || '').toString().trim();
    if (currentGroup && title !== '' && currentGroup.title === title) {
      currentGroup.rows.push({ row, rowNumber });
    } else {
      currentGroup = { title, rows: [{ row, rowNumber }] };
      groups.push(currentGroup);
    }
  });

  return groups.map((group) => {
    const rowNumbers = group.rows.map((r) => r.rowNumber);

    for (const { row, rowNumber } of group.rows) {
      const errorMessage = _getRowValidationError(row, rowNumber);
      if (errorMessage) {
        return { rowNumbers, status: 'error', errors: [errorMessage] };
      }
    }

    const firstRow = group.rows[0].row;
    const externalId = (firstRow['testCaseId'] || '').toString().trim() || null;
    const steps = group.rows.map((r, i) => ({
      stepNo: i + 1,
      step: r.row['step'] || '',
      result: r.row['expectedStepResult'] || '',
    }));

    return {
      rowNumbers,
      status: 'pending',
      externalId,
      module: null,
      title: group.title,
      description: firstRow['description'] || '',
      priority: priorities.indexOf(firstRow['priority']),
      type: testTypes.indexOf(firstRow['type']),
      preConditions: firstRow['preConditions'] || '',
      expectedResults: firstRow['expectedResults'] || '',
      automationStatus: firstRow['automationStatus']
        ? automationStatus.indexOf(firstRow['automationStatus'])
        : automationStatus.indexOf('automation-not-required'),
      template: templates.indexOf(firstRow['template']),
      steps,
    };
  });
}

// Parse reference format: each row is one test case, steps are newline-separated in a single cell.
// Returns one entry per row, each either a parsed case or an error.
function _parseReferenceFormat(jsonData) {
  return jsonData.map((row, index) => {
    const rowNumber = index + 2;
    const title = (row['Test Scenario'] || row['title'] || '').toString().trim();
    if (!title) {
      return { rowNumbers: [rowNumber], status: 'error', errors: [`Row ${rowNumber} is missing required field: Test Scenario`] };
    }

    const rawPriority = (row['Priority'] || row['priority'] || 'medium').toString().toLowerCase();
    let priorityIndex = priorities.indexOf(rawPriority);
    if (priorityIndex === -1) {
      priorityIndex = priorities.indexOf('medium');
    }

    const rawType = (row['Type'] || row['type'] || 'other').toString().toLowerCase();
    let typeIndex = testTypes.indexOf(rawType);
    if (typeIndex === -1) {
      typeIndex = testTypes.indexOf('other');
    }

    const descParts = [];
    if (row['Test Data']) descParts.push(`Test Data: ${row['Test Data']}`);
    if (row['Comments']) descParts.push(`Comments: ${row['Comments']}`);
    if (row['description']) descParts.push(row['description']);
    const description = descParts.join('\n') || '';

    const rawSteps = (row['Test Steps'] || row['step'] || '').toString();
    const parsedSteps = _parseMultilineSteps(rawSteps);
    const hasSteps = parsedSteps.length > 0 && parsedSteps.some((s) => s.trim() !== '');

    const rawTemplate = (row['template'] || '').toString().toLowerCase();
    let templateIndex;
    if (rawTemplate && templates.indexOf(rawTemplate) !== -1) {
      templateIndex = templates.indexOf(rawTemplate);
    } else {
      templateIndex = hasSteps ? templates.indexOf('step') : templates.indexOf('text');
    }

    const externalId = (row['Test Case ID'] || '').toString().trim() || null;
    const module = row['Module'] ? row['Module'].toString().trim() : null;

    const steps = hasSteps
      ? parsedSteps.map((stepText, stepIdx) => ({ stepNo: stepIdx + 1, step: stepText.trim(), result: '' }))
      : [{ stepNo: 1, step: '', result: '' }];

    return {
      rowNumbers: [rowNumber],
      status: 'pending',
      externalId,
      module,
      title,
      description,
      priority: priorityIndex,
      type: typeIndex,
      preConditions: row['Pre - Condition'] || row['preConditions'] || '',
      expectedResults: row['Expected Result'] || row['expectedResults'] || '',
      automationStatus: row['automationStatus']
        ? automationStatus.indexOf(row['automationStatus'])
        : automationStatus.indexOf('automation-not-required'),
      template: templateIndex,
      steps,
    };
  });
}

// Parse multiline steps from a single cell value
// Handles formats like: "1. Step one\n2. Step two\n3. Step three"
// or plain lines separated by newlines
function _parseMultilineSteps(rawText) {
  if (!rawText || rawText.trim() === '') return [];

  const lines = rawText.split(/\n/).filter((line) => line.trim() !== '');

  const numberedPattern = /^\d+[.)]\s*/;
  const allNumbered = lines.length > 0 && lines.every((line) => numberedPattern.test(line.trim()));

  if (allNumbered) {
    return lines.map((line) => line.trim().replace(numberedPattern, '').trim());
  }

  return lines.map((line) => line.trim());
}

// A Test Case ID reused across rows/sheets in the same upload is ambiguous:
// demote every occurrence after the first to an error.
function _flagDuplicateExternalIds(sheets) {
  const seen = new Map(); // externalId -> first rowNumber

  for (const sheet of sheets) {
    for (const c of sheet.cases) {
      if (c.status !== 'pending' || !c.externalId) continue;

      if (seen.has(c.externalId)) {
        c.status = 'error';
        c.errors = [
          `Row ${c.rowNumbers.join(', ')} has duplicate Test Case ID '${c.externalId}' (already used at row ${seen.get(c.externalId)})`,
        ];
      } else {
        seen.set(c.externalId, c.rowNumbers.join(', '));
      }
    }
  }
}

// Look up which pending cases' Test Case IDs already exist somewhere in the
// project, and tag each pending case 'new' or 'update' accordingly.
async function _resolveNewVsUpdate(sheets, Case, Folder, projectId) {
  const externalIds = [
    ...new Set(
      sheets.flatMap((sheet) => sheet.cases).filter((c) => c.status === 'pending' && c.externalId).map((c) => c.externalId)
    ),
  ];

  const matchMap = new Map();
  if (externalIds.length > 0) {
    const matches = await Case.findAll({
      where: { externalId: { [Op.in]: externalIds } },
      include: [{ model: Folder, where: { projectId }, attributes: [] }],
      attributes: ['id', 'externalId'],
    });
    for (const match of matches) {
      if (!matchMap.has(match.externalId)) {
        matchMap.set(match.externalId, match.id);
      }
    }
  }

  for (const sheet of sheets) {
    for (const c of sheet.cases) {
      if (c.status !== 'pending') continue;
      if (c.externalId && matchMap.has(c.externalId)) {
        c.status = 'update';
        c.matchedCaseId = matchMap.get(c.externalId);
      } else {
        c.status = 'new';
      }
    }
  }
}
