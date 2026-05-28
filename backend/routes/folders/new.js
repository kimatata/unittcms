import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(db);
  const Folder = db.repos.folders;

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
}
