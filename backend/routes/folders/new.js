const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const defineFolder = require('../../models/folders');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
  const Folder = defineFolder(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    try {
      const projectId = req.query.projectId;
      const { name, detail, parentFolderId } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Name and projectId are required' });
      }

      const newFolder = await Folder.create({
        name,
        detail,
        projectId,
        parentFolderId,
      });

      res.json(newFolder);
    } catch (error) {
      console.error('Error creating new folder:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
