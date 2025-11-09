import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRun from '../../models/runs.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromProjectId } = editableMiddleware(sequelize);
  const Run = defineRun(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectReporterFromProjectId, async (req, res) => {
    try {
      const projectId = req.query.projectId;
      const { name, configurations, description, state } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Name and projectId are required' });
      }

      const newRun = await Run.create({
        name,
        configurations,
        description,
        state,
        projectId,
      });

      res.json(newRun);
    } catch (error) {
      console.error('Error creating new run:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
