const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.post('/', async (req, res) => {
    const runId = req.query.runId;
    const caseId = req.query.caseId;

    try {
      // Check if the record already exists
      const existingRunCase = await RunCase.findOne({
        where: {
          runId: runId,
          caseId: caseId,
        },
      });

      if (existingRunCase) {
        return res.status(400).send('Record already exists');
      }

      const newRunCase = await RunCase.create({
        runId: runId,
        caseId: caseId,
        status: 0,
      });

      res.json(newRunCase);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
