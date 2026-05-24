import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineIntegrationConfig from '../../models/integrationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const IntegrationConfig = defineIntegrationConfig(sequelize, DataTypes);

  router.post('/upsert', verifySignedIn, async (req, res) => {
    try {
      const { projectId, service, apiKey } = req.body;
      if (!projectId || !service || !apiKey) {
        return res.status(400).send('projectId, service, and apiKey are required');
      }

      const [config, created] = await IntegrationConfig.findOrCreate({
        where: { projectId, service },
        defaults: { projectId, service, apiKey },
      });

      if (!created) {
        // Only update if a real key was provided (not the masked placeholder)
        if (apiKey && !apiKey.startsWith('***')) {
          await config.update({ apiKey });
        }
      }

      const data = config.toJSON();
      data.apiKey = maskKey(data.apiKey);
      res.json(data);
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
