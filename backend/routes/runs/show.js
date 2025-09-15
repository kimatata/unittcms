import express from 'express';
const router = express.Router();
import { DataTypes, literal } from 'sequelize';
import defineRun from '../../models/runs.js';
import defineRunCase from '../../models/runCases.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(sequelize);
  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.get('/:runId', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const runId = req.params.runId;

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    try {
      const run = await Run.findByPk(runId);
      if (!run) {
        return res.status(404).send('Run not found');
      }

      // Counts test case status belonging to the run
      const statusCounts = await RunCase.findAll({
        attributes: ['status', [literal('COUNT(*)'), 'count']],
        where: {
          runId: run.id,
        },
        group: ['status'],
      });

      res.json({ run, statusCounts });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
