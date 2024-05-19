const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.post('/bulknew', async (req, res) => {
    const recordsToCreate = req.body;

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
