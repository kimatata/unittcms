const express = require('express');
const router = express.Router();
const Papa = require('papaparse');
const { create } = require('xmlbuilder2');

const defineRun = require('../../models/runs');
const defineRunCase = require('../../models/runCases');
const defineCase = require('../../models/cases');

module.exports = function (sequelize) {
  const { DataTypes } = require('sequelize');
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromRunId } = require('../../middleware/verifyVisible')(sequelize);

  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);

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

      if (type === 'csv') {
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

      if (type === 'xml') {
        const xml = create({ version: '1.0' }).ele('testsuite', {
          name: `Run ${run.id}: ${run.name}`,
          tests: runCases.length,
          failures: runCases.filter((rc) => rc.status === 2).length,
          skipped: runCases.filter((rc) => rc.status === 3).length,
        });

        for (const rc of runCases) {
          const testCase = xml.ele('testcase', {
            name: rc.Case.title,
            classname: `Case_${rc.Case.id}`,
            time: '0', // TODO
          });

          if (rc.status === 2) {
            testCase.ele('failure', { message: 'Test failed' }).txt('Failure details here');
          } else if (rc.status === 3) {
            testCase.ele('skipped');
          }

          testCase.up();
        }

        const xmlString = xml.end({ prettyPrint: true });

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=run_${runId}.xml`);
        return res.send(xmlString);
      }

      return res.status(400).json({ error: 'Unsupported type. Use ?type=csv or ?type=junit' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
