const express = require("express");
const router = express.Router();
const defineFolder = require("../../models/folders");
const { DataTypes } = require("sequelize");

module.exports = function (sequelize) {
  const Folder = defineFolder(sequelize, DataTypes);

  router.post("/", async (req, res) => {
    try {
      const { name, detail, projectId, parentFolderId } = req.body;
      if (!name || !projectId) {
        return res
          .status(400)
          .json({ error: "Name and projectId are required" });
      }

      const newFolder = await Folder.create({
        name,
        detail,
        projectId,
        parentFolderId,
      });

      res.json(newFolder);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
