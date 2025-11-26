import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import Papa from 'papaparse';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineFolder from '../../models/folders.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';
import { testRunStatus, priorities, testTypes, automationStatus, templates } from '../../config/enums.js';

export default function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  Case.belongsTo(Folder);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromFolderId } = visibilityMiddleware(sequelize);

  router.get('/download', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { folderId, type } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'download type is required' });
    }

    try {
      const cases = await Case.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt', 'caseSteps'] },
        include: [
          {
            model: Step,
            through: { attributes: [] },
            order: [['stepNo', 'ASC']],
            attributes: { exclude: ['createdAt', 'updatedAt'] },
          },
          {
            model: Folder,
            attributes: ['name'],
          },
        ],
        where: { folderId },
        raw: true,
      });

      if (cases.length === 0) {
        return res.status(404).send('No cases found');
      }

      // Convert numeric values to human-readable labels
      const casesWithLabels = cases.map((c) => ({
        ...c,
        state: testRunStatus[c.state] || c.state,
        priority: priorities[c.priority] || c.priority,
        type: testTypes[c.type] || c.type,
        automationStatus: automationStatus[c.automationStatus] || c.automationStatus,
        template: templates[c.template] || c.template,
      }));

      if (type === 'json') {
        const formattedJsonCases = _formatRawCasesToJson(casesWithLabels);
        return res.json(formattedJsonCases);
      } else if (type === 'csv') {
        const formattedCsvCases = _formatRawCasesToCsv(casesWithLabels);
        const csv = Papa.unparse(formattedCsvCases, {
          quotes: true,
          skipEmptyLines: true,
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=cases_folder_${folderId}.csv`);
        return res.send(csv);
      }

      return res.status(400).json({ error: 'Unsupported type. Use ?type=json or ?type=csv' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}

// Group cases by caseId and format steps to Steps array to better visualization
const _formatRawCasesToJson = (cases) => {
  const casesObject = {};

  cases.forEach((c) => {
    if (!casesObject[c.id]) {
      casesObject[c.id] = {
        id: c.id,
        folderId: c.folderId,
        folder: c['Folder.name'],
        title: c.title,
        state: c.state,
        priority: c.priority,
        type: c.type,
        automationStatus: c.automationStatus,
        description: c.description,
        template: c.template,
        preConditions: c.preConditions,
        expectedResults: c.expectedResults,
        Steps: [],
      };
    }

    if (c['Steps.id']) {
      casesObject[c.id].Steps.push({
        step: c['Steps.step'],
        expectedStepResult: c['Steps.result'],
      });
    }
  });

  return casesObject;
};

// Rename fields to better CSV headers
const _formatRawCasesToCsv = (cases) => {
  return cases.map((c) => ({
    id: c.id,
    folderId: c.folderId,
    folder: c['Folder.name'],
    title: c.title,
    state: c.state,
    priority: c.priority,
    type: c.type,
    automationStatus: c.automationStatus,
    description: c.description,
    template: c.template,
    preConditions: c.preConditions,
    expectedResults: c.expectedResults,
    step: c['Steps.step'],
    expectedStepResult: c['Steps.result'],
  }));
};
