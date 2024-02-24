const express = require("express");
const router = express.Router();
const defineCase = require("../../models/cases");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);

  router.get("/", async (req, res) => {
    const { caseId, folderId } = req.query;

    if (!caseId && !folderId) {
      return res.status(400).json({ error: "caseId or folderId is required" });
    }

    if (caseId) {
      const testcase = await Case.findByPk(caseId);
      return res.json(testcase);
    }

    try {
      const cases = await Case.findAll({
        where: {
          folderId: folderId,
        },
      });
      res.json(cases);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
