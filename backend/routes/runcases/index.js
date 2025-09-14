import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRunCase from '../../models/runCases';
import authMiddleware from '../../middleware/auth';
import visibilityMiddleware from '../../middleware/verifyVisible';

module.exports = function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const { runId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'run is required' });
    }

    try {
      const runCases = await RunCase.findAll({
        where: {
          runId: runId,
        },
      });
      res.json(runCases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
