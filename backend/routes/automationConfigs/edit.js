import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.put('/:id', verifySignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const { provider, repoName, automationTool, automationLanguage, autoFixEnabled } = req.body;

      const config = await db.repos.automationConfigs.findByPk(id);
      if (!config) {
        return res.status(404).send('Not found');
      }

      const updates = { provider, repoName, automationTool, automationLanguage };
      if (autoFixEnabled !== undefined) updates.autoFixEnabled = autoFixEnabled;

      await config.update(updates);

      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
