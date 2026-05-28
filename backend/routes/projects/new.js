import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const Project = db.repos.projects;

  router.post('/', verifySignedIn, async (req, res) => {
    try {
      const { name, detail, isPublic } = req.body;
      const newProject = await Project.create({
        name,
        detail,
        isPublic,
        userId: req.userId,
      });
      res.json(newProject);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
