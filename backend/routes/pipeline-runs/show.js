import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiPipelineRun from '../../models/ciPipelineRun.js';
import defineCiPipelineJob from '../../models/ciPipelineJob.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromPipelineRunId } = visibilityMiddleware(sequelize);
  const CiPipelineRun = defineCiPipelineRun(sequelize, DataTypes);
  const CiPipelineJob = defineCiPipelineJob(sequelize, DataTypes);
  CiPipelineRun.hasMany(CiPipelineJob, { foreignKey: 'pipelineRunId', as: 'jobs' });

  router.get('/:runId', verifySignedIn, verifyProjectVisibleFromPipelineRunId, async (req, res) => {
    const { runId } = req.params;

    try {
      const run = await CiPipelineRun.findByPk(runId, {
        include: [{ model: CiPipelineJob, as: 'jobs' }],
      });
      if (!run) {
        return res.status(404).send('Pipeline run not found');
      }
      res.json(run);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
