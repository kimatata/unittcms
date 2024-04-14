const express = require("express");
const router = express.Router();
const defineRun = require("../../models/runs");
const defineCase = require("../../models/cases");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const Run = defineRun(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  Run.belongsToMany(Case, { through: "runCases" });
  Case.belongsToMany(Run, { through: "runCases" });

  router.get("/:runId", async (req, res) => {
    const runId = req.params.runId;

    if (!runId) {
      return res.status(400).json({ error: "runId is required" });
    }

    try {
      const project = await Run.findByPk(runId, {
        include: [
          {
            model: Case,
            through: { attributes: ["status"] },
          },
        ],
      });
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
