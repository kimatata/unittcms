import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiPipelineRun from '../../models/ciPipelineRun.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromCiConfigId } = visibilityMiddleware(sequelize);
  const CiPipelineRun = defineCiPipelineRun(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromCiConfigId, async (req, res) => {
    const { configId } = req.query;
    if (!configId) {
      return res.status(400).json({ error: 'configId is required' });
    }

    try {
      const runs = await CiPipelineRun.findAll({
        where: { configId },
        order: [['startedAt', 'DESC']],
      });
      res.json(runs);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
