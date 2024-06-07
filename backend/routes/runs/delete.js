const express = require('express');
const router = express.Router();
const defineRun = require('../../models/runs');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);
  const Run = defineRun(sequelize, DataTypes);

  router.delete('/:runId', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.params.runId;
    try {
      const testrun = await Run.findByPk(runId);
      if (!testrun) {
        return res.status(404).send('Run not found');
      }
      await testrun.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
