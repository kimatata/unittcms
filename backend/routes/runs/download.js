import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import Papa from 'papaparse';
import { create } from 'xmlbuilder2';
import defineRun from '../../models/runs.js';
import defineRunCase from '../../models/runCases.js';
import defineCase from '../../models/cases.js';
import defineFolder from '../../models/folders.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';
import { testRunCaseStatus, testRunStatus, priorities, testTypes, automationStatus } from '../../config/enums.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(sequelize);

  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);

  RunCase.belongsTo(Case, { foreignKey: 'caseId' });

  router.get('/download/:runId', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const { runId } = req.params;
    const { type } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    try {
      const run = await Run.findByPk(runId);
      if (!run) {
        return res.status(404).send('Run not found');
      }

      const runCases = await RunCase.findAll({
        where: { runId },
        include: [{ model: Case }],
      });

      if (type === 'xml') {
        // JUnit xml valid status
        const validStatuses = [1, 2, 4]; // 0: untested, 1: passed, 2 failed, 3: retest, 4: skipped
        const filteredRunCases = runCases.filter((rc) => validStatuses.includes(rc.status));

        // group cases by folder
        const folderMap = new Map();
        for (const rc of filteredRunCases) {
          const folderId = rc.Case.folderId;
          if (!folderMap.has(folderId)) {
            folderMap.set(folderId, []);
          }
          folderMap.get(folderId).push(rc);
        }

        // Construct JUnit xml
        const xml = create({ version: '1.0' });
        const root = xml.ele('testsuites');

        for (const [folderId, cases] of folderMap.entries()) {
          let folderName = '';
          const folder = await Folder.findByPk(folderId);
          if (folder) {
            folderName = folder.name;
          }

          const suite = root.ele('testsuite', {
            name: folderName,
            tests: cases.length,
            failures: cases.filter((c) => c.status === 2).length,
            skipped: cases.filter((c) => c.status === 4).length,
          });

          for (const rc of cases) {
            const testCase = suite.ele('testcase', {
              name: rc.Case.title,
              classname: folderName,
              time: '0',
            });

            if (rc.status === 2) {
              testCase.ele('failure', { message: 'Test failed' }).txt('Test case failed.');
            } else if (rc.status === 4) {
              testCase.ele('skipped', { message: 'skipped' });
            }
          }
        }

        const xmlString = xml.end({ prettyPrint: true });

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=run_${runId}.xml`);
        return res.send(xmlString);
      } else if (type === 'json') {
        return res.json(runCases);
      } else if (type === 'csv') {
        const records = runCases.map((rc) => ({
          id: rc.Case.id,
          title: rc.Case.title,
          state: testRunStatus[rc.Case.state] || rc.Case.state,
          priority: priorities[rc.Case.priority] || rc.Case.priority,
          type: testTypes[rc.Case.type] || rc.Case.type,
          automationStatus: automationStatus[rc.Case.automationStatus] || rc.Case.automationStatus,
          status: testRunCaseStatus[rc.status] || rc.status,
        }));

        const csv = Papa.unparse(records, {
          quotes: true,
          skipEmptyLines: true,
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=run_${runId}.csv`);
        return res.send(csv);
      }

      return res.status(400).json({ error: 'Unsupported type. Use ?type=xml or ?type=json or ?type=csv' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
