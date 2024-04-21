const express = require("express");
const router = express.Router();
const defineRunCase = require("../../models/runCases");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.put("/", async (req, res) => {
    const runId = req.query.runId;
    const caseId = req.query.caseId;
    const status = req.query.status;

    try {
      const runCase = await RunCase.findOne({
        where: {
          runId: runId,
          caseId: caseId,
        },
      });

      if (!runCase) {
        return res.status(404).send("Runcase not found");
      }

      await runCase.update({
        runId,
        caseId,
        status,
      });
      res.json(runCase);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
