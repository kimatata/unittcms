import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiPipelineJob from '../../models/ciPipelineJob.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromPipelineRunId } = visibilityMiddleware(sequelize);
  const CiPipelineJob = defineCiPipelineJob(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromPipelineRunId, async (req, res) => {
    const { pipelineRunId } = req.query;
    if (!pipelineRunId) {
      return res.status(400).json({ error: 'pipelineRunId is required' });
    }

    try {
      const jobs = await CiPipelineJob.findAll({
        where: { pipelineRunId },
        order: [['startedAt', 'ASC']],
      });
      res.json(jobs);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
