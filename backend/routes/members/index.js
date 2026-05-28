import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const members = await db.repos.members.findAll({
        where: {
          projectId: projectId,
        },
        include: [
          {
            model: db.repos.users,
          },
        ],
      });
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
