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
      const project = await db.repos.projects.findByPk(projectId);
      if (!project) {
        return res.status(404).send('Project not found');
      }

      const [members, ownerUser] = await Promise.all([
        db.repos.members.findAll({
          where: { projectId },
          include: [{ model: db.repos.users }],
        }),
        db.repos.users.findByPk(project.userId),
      ]);

      const ownerEntry = {
        id: null,
        userId: ownerUser.id,
        projectId: Number(projectId),
        role: null,
        isOwner: true,
        User: ownerUser,
      };

      const nonOwnerMembers = members.filter((m) => m.userId !== project.userId);
      res.json([ownerEntry, ...nonOwnerMembers]);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
