import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineFolder from '../../models/folders.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(sequelize);
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
}
