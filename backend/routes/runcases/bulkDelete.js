const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const RunCase = defineRunCase(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);

  router.post('/bulkdelete', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const recordsToDelete = req.body;

    // TODO Instead of receiving a combination of runId and caseId from frontend,
    // receives only an array of caseId and constructs a pair from the query parameter runId
    try {
      const existingRunCases = await RunCase.findAll({
        where: {
          [Op.or]: recordsToDelete.map((condition) => ({
            runId: condition.runId,
            caseId: condition.caseId,
          })),
        },
      });

      if (existingRunCases.length === 0) {
        return res.status(200).send('No records found to delete');
      }

      await RunCase.destroy({
        where: {
          [Op.or]: recordsToDelete.map((condition) => ({
            runId: condition.runId,
            caseId: condition.caseId,
          })),
        },
      });

      res.status(200).send('Records deleted successfully');
    } catch (error) {
      console.error('Error deleting run cases:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
