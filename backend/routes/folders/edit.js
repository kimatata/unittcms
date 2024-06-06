const express = require('express');
const router = express.Router();
const defineFolder = require('../../models/folders');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromFolderId } = require('../../middleware/verifyEditable')(sequelize);
  const Folder = defineFolder(sequelize, DataTypes);

  router.put('/:folderId', verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const folderId = req.params.folderId;
    const { name, detail, projectId, parentFolderId } = req.body;
    try {
      const folder = await Folder.findByPk(folderId);
      if (!folder) {
        return res.status(404).send('Folder not found');
      }
      await folder.update({
        name,
        detail,
        projectId,
        parentFolderId,
      });
      res.json(folder);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
