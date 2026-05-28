import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);

  router.get('/:projectId', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const project = await db.repos.projects.findByPk(projectId, {
        include: [
          {
            model: db.models.Folder,
            include: [{ model: db.models.Case }],
          },
          { model: db.models.Run, include: [{ model: db.models.RunCase }] },
        ],
      });
      if (!project) {
        return res.status(404).send('Project not found');
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
