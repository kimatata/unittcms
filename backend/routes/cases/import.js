import path from 'path';
import express from 'express';
const router = express.Router();
import multer from 'multer';
import XLSX from 'xlsx';
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineCaseStep from '../../models/caseSteps.js';
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let currentTitle = null;
        let previousTitle = null;
        let stepNo = 1;
        const casesToCreate = [];
        const stepsToCreate = [];
        for (const [index, row] of jsonData.entries()) {
          const errorMessage = _getRowValidationError(row, index);
          if (errorMessage) {
            return res.status(400).json({ error: errorMessage });
          }

          // Add step to the same case if the current row title is equal to previous row title
          // This handle cases with multiple steps :)
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
              state: 0, // default state
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

        // 'Manually' create cases, steps and caseStep association.
        const createdCases = await Case.bulkCreate(casesToCreate, { transaction: t });
        for (const stepData of stepsToCreate) {
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
