import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/upsert', verifySignedIn, async (req, res) => {
    try {
      const { projectId, service, apiKey, settings } = req.body;
      if (!projectId || !service || !apiKey) {
        return res.status(400).send('projectId, service, and apiKey are required');
      }

      const settingsJson = settings ? JSON.stringify(settings) : null;

      const [config, created] = await db.repos.integrationConfigs.findOrCreate({
        where: { projectId, service },
        defaults: { projectId, service, apiKey, settings: settingsJson },
      });

      if (!created) {
        const updates = { settings: settingsJson };
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
