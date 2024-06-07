const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.delete('/', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.query.runId;
    const caseId = req.query.caseId;

    try {
      // Get RunCase to be deleted.
      const deletingRunCase = await RunCase.findOne({
        where: {
          runId: runId,
          caseId: caseId,
        },
      });

      if (!deletingRunCase) {
        return res.status(404).send('RunCase not found');
      }

      await deletingRunCase.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
