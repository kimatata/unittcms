const express = require("express");
const router = express.Router();
const defineRun = require("../../models/runs");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const Run = defineRun(sequelize, DataTypes);

  router.get("/:runId", async (req, res) => {
    const runId = req.params.runId;

    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    try {
      const project = await Run.findByPk(runId);
      if (!project) {
        return res.status(404).send("Run not found");
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
