import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineProject from '../../models/projects.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const Project = defineProject(sequelize, DataTypes);

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
