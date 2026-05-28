import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const projectId = req.query.projectId;

    if (!projectId) {
      return res.status(400).json({
        error: 'projectId is required',
      });
    }

    try {
      const tags = await db.repos.tags.findAll({
        where: {
          projectId: projectId,
        },
        order: [['name', 'ASC']],
      });
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
