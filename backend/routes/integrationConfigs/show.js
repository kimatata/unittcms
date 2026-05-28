import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.get('/project/:projectId', verifySignedIn, async (req, res) => {
    try {
      const { projectId } = req.params;
      const configs = await db.repos.integrationConfigs.findAll({ where: { projectId } });
      const masked = configs.map((c) => {
        const d = c.toJSON();
        d.apiKey = maskKey(d.apiKey);
        d.settings = d.settings ? JSON.parse(d.settings) : null;
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
