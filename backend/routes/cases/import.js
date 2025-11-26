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

        let errorMessage = null;
        let currentTitle = null;
        let stepNo = 1;
        const casesToCreate = [];
        const stepsToCreate = [];
        const requiredFields = ['title', 'priority', 'type', 'template'];
        for (const [index, row] of jsonData.entries()) {
          const rowNumber = index + 2;
          for (const field of requiredFields) {
            if (!row[field]) {
              errorMessage = `Row ${rowNumber} is missing required field: ${field}`;
              console.log(`Error found for field: ${errorMessage}`);
            }
          }

          // Validate priority if provided
          let priorityIndex = priorities.indexOf('medium'); // default to 'medium'
          if (row['priority']) {
            priorityIndex = priorities.indexOf(row['priority'].toLowerCase());
            if (priorityIndex === -1) {
              errorMessage = `Row ${rowNumber} has invalid priority: ${row['priority']}`;
            }
          }

          // Validate type if provided
          let typeIndex = testTypes.indexOf('other'); // default to 'other'
          if (row['type']) {
            typeIndex = testTypes.indexOf(row['type'].toLowerCase());
            if (typeIndex === -1) {
              errorMessage = `Row ${rowNumber} has invalid type: ${row['type']}`;
            }
          }

          // Validate automationStatus if provided
          let automationStatusIndex = automationStatus.indexOf('automation-not-required'); // default to 'automation-not-required'
          if (row['automationStatus']) {
            automationStatusIndex = automationStatus.indexOf(row['automationStatus'].toLowerCase());
            if (automationStatusIndex === -1) {
              errorMessage = `Row ${rowNumber} has invalid automationStatus: ${row['automationStatus']}`;
            }
          }

          // Validate template if provided
          let templateIndex = templates.indexOf('text'); // default to 'text'
          if (row['template']) {
            templateIndex = templates.indexOf(row['template'].toLowerCase());
            if (templateIndex === -1) {
              errorMessage = `Row ${rowNumber} has invalid template: ${row['template']}`;
            }
          }

          if (errorMessage) {
            return res.status(400).json({ error: errorMessage });
          }

          currentTitle = row['title'].trim();
          if (casesToCreate.length > 0 && casesToCreate[casesToCreate.length - 1].title === currentTitle) {
            stepsToCreate.push({
              caseIndex: casesToCreate.length - 1,
              stepNo: stepNo,
              step: row['step'] || '',
              result: row['expectedStepResult'] || '',
            });
            stepNo += 1;
          } else {
            casesToCreate.push({
              folderId: folderId,
              title: currentTitle,
              description: row['description'] || '',
              state: 0, // default state
              priority: priorityIndex,
              type: typeIndex,
              preConditions: row['preConditions'],
              expectedResults: row['expectedResults'],
              automationStatus: automationStatusIndex,
              template: templateIndex,
            });
            stepNo = 1;
          }
        }
        const createdCases = await Case.bulkCreate(casesToCreate, { transaction: t, returning: true });

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
        res.status(500).send('Internal Server Error');
      }
    }
  );

  return router;
}
