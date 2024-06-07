const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.post('/bulknew', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const recordsToCreate = req.body;

    // TODO Instead of receiving a combination of runId and caseId from frontend,
    // receives only an array of caseId and constructs a pair from the query parameter runId
    try {
      const existingRunCases = await RunCase.findAll({
        where: {
          [Op.or]: recordsToCreate.map((record) => ({
            runId: record.runId,
            caseId: record.caseId,
          })),
        },
      });

      // Filter out records that already exist
      const recordsToCreateFiltered = recordsToCreate.filter((record) => {
        return !existingRunCases.some(
          (existingRecord) => existingRecord.runId == record.runId && existingRecord.caseId == record.caseId
        );
      });

      const newRunCases = await RunCase.bulkCreate(
        recordsToCreateFiltered.map((record) => ({
          runId: record.runId,
          caseId: record.caseId,
          status: 0,
        }))
      );

      res.json(newRunCases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
