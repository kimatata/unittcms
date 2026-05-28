import express from 'express';
const router = express.Router();
import { literal } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(db);

  router.get('/:runId', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const runId = req.params.runId;

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    try {
      const run = await db.repos.runs.findByPk(runId);
      if (!run) {
        return res.status(404).send('Run not found');
      }

      // Counts test case status belonging to the run
      const statusCounts = await db.repos.runCases.findAll({
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
