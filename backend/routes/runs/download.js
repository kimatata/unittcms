const express = require('express');
const router = express.Router();
const Papa = require('papaparse');
const { create } = require('xmlbuilder2');

const defineRun = require('../../models/runs');
const defineRunCase = require('../../models/runCases');
const defineCase = require('../../models/cases');
const defineFolder = require('../../models/folders');

module.exports = function (sequelize) {
  const { DataTypes } = require('sequelize');
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromRunId } = require('../../middleware/verifyVisible')(sequelize);

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
          state: rc.Case.state,
          priority: rc.Case.priority,
          type: rc.Case.type,
          automationStatus: rc.Case.automationStatus,
          status: rc.status,
        }));

        const csv = Papa.unparse(records, {
          quotes: true,
          skipEmptyLines: true,
        });

        res.setHeader('Content-Type', 'text/csv');
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
};
