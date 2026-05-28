import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.get('/check', verifySignedIn, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const members = await db.repos.members.findAll({
        where: {
          userId: userId,
        },
      });

      const myProjects = await db.repos.projects.findAll({
        where: {
          userId: userId,
        },
      });

      const projectRoles = members.map((member) => {
        return { projectId: member.projectId, isOwner: false, isMember: true, role: member.role };
      });
      const ownProjectRoles = myProjects.map((project) => {
        return { projectId: project.id, isOwner: true, isMember: true, role: 0 };
      });
      projectRoles.push(...ownProjectRoles);

      res.json(projectRoles);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
