import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { getProvider } from '../../services/ciProviders/index.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);

  router.post('/ping', verifySignedIn, async (req, res) => {
    const { provider: providerName, repoOwner, repoName, accessToken } = req.body;

    if (!providerName || !repoOwner || !repoName || !accessToken) {
      return res.status(400).json({ error: 'provider, repoOwner, repoName and accessToken are required.' });
    }

    try {
      const provider = getProvider(providerName);

      try {
        const result = await provider.verifyConnection(accessToken, repoOwner, repoName);
        return res.json({ ok: true, ...result });
      } catch (err) {
        if (err.statusCode === 401) return res.status(401).json({ error: err.message });
        if (err.statusCode === 403) return res.status(403).json({ error: err.message });
        if (err.statusCode === 404) return res.status(404).json({ error: 'Repository not found.' });
        if (err.statusCode === 429) return res.status(429).json({ error: err.message });
        throw err;
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
