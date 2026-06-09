import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineRunCase from '../../models/runCases.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const { runId, assigneeUserId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'run is required' });
    }

    try {
      const where = { runId };

      if (assigneeUserId !== undefined) {
        if (assigneeUserId === 'null') {
          where.assigneeUserId = { [Op.is]: null };
        } else {
          where.assigneeUserId = Number(assigneeUserId);
        }
      }

      const runCases = await RunCase.findAll({ where });
      res.json(runCases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
