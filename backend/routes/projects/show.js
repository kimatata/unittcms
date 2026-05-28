import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);
  const Project = db.repos.projects;
  const Folder = db.repos.folders;

  router.get('/:projectId', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const projectId = req.params.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: Folder,
          },
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
