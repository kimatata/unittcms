import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineIntegrationConfig from '../../models/integrationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const IntegrationConfig = defineIntegrationConfig(sequelize, DataTypes);

  router.get('/project/:projectId', verifySignedIn, async (req, res) => {
    try {
      const { projectId } = req.params;
      const configs = await IntegrationConfig.findAll({ where: { projectId } });
      const masked = configs.map((c) => {
        const d = c.toJSON();
        d.apiKey = maskKey(d.apiKey);
        return d;
      });
      res.json(masked);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}

function maskKey(key) {
  if (!key || key.length <= 8) return '***';
  return '***' + key.slice(-4);
}
