const express = require("express");
const router = express.Router();
const defineCase = require("../../models/cases");
const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
  const Run = defineCase(sequelize, DataTypes)

  router.get("/", async (req, res) => {
    const { folderId } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    try {
      const runs = await Run.findAll({
        where: {
          folderId: folderId
        }
      });
      res.json(runs);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};