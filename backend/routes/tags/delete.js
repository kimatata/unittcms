import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(db);

  router.delete('/:tagId', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { tagId } = req.params;
    const projectId = req.query.projectId;

    if (!tagId || !projectId) {
      return res.status(400).json({
        error: 'tagId and projectId are required',
      });
    }

    try {
      const deletedTag = await db.repos.tags.destroy({
        where: {
          id: tagId,
          projectId,
        },
      });

      if (!deletedTag) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting tag:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
