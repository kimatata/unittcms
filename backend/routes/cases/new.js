const express = require("express");
const router = express.Router();
const defineCase = require("../../models/cases");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);

  router.post("/", async (req, res) => {
    try {
      const { title, state, priority, type, automationStatus, description, template, preConditions, expectedResults, folderId } = req.body;
      if (!title || !state || !priority || !type || !automationStatus || !template || !folderId) {
        return res.status(400).json({ error: "Title, state, priority, type, automationStatus, template, and folderId are required" });
      }

      const newCase = await Case.create({
        title,
        state,
        priority,
        type,
        automationStatus,
        description,
        template,
        preConditions,
        expectedResults,
        folderId,
      });

      res.json(newCase);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
