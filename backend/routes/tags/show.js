import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);

  router.get('/:tagId', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const tagId = req.params.tagId;
    const projectId = req.query.projectId;

    if (!tagId || !projectId) {
      return res.status(400).json({
        error: 'tagId and projectId are required',
      });
    }

    try {
      const tag = await db.repos.tags.findOne({
        where: {
          projectId: projectId,
          id: tagId,
        },
      });

      if (!tag) {
        return res.status(404).json({ error: 'Tag not found' });
      }
      res.json(tag);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
