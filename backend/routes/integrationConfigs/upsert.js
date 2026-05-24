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
      const { projectId, service, apiKey, settings } = req.body;
      if (!projectId || !service || !apiKey) {
        return res.status(400).send('projectId, service, and apiKey are required');
      }

      const settingsJson = settings ? JSON.stringify(settings) : null;

      const [config, created] = await IntegrationConfig.findOrCreate({
        where: { projectId, service },
        defaults: { projectId, service, apiKey, settings: settingsJson },
      });

      if (!created) {
        const updates = { settings: settingsJson };
        // Only update token if a real value was provided (not the masked placeholder)
        if (apiKey && !apiKey.startsWith('***')) {
          updates.apiKey = apiKey;
        }
        await config.update(updates);
      }

      const data = config.toJSON();
      data.apiKey = maskKey(data.apiKey);
      data.settings = data.settings ? JSON.parse(data.settings) : null;
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
