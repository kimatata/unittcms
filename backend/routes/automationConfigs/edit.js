import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.put('/:id', verifySignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        provider, repoName, automationTool, automationLanguage, autoFixEnabled,
        sourceRepoOwner, sourceRepoName, sourceRepoBranch, webhookSecret, autoAnalyzeCommits,
        sourceProvider, repoUrl, repoId,
      } = req.body;

      const config = await db.repos.automationConfigs.findByPk(id);
      if (!config) {
        return res.status(404).send('Not found');
      }

      const updates = {};
      if (provider !== undefined) updates.provider = provider;
      if (repoName !== undefined) updates.repoName = repoName;
      if (automationTool !== undefined) updates.automationTool = automationTool;
      if (automationLanguage !== undefined) updates.automationLanguage = automationLanguage;
      if (autoFixEnabled !== undefined) updates.autoFixEnabled = autoFixEnabled;
      if (sourceRepoOwner !== undefined) updates.sourceRepoOwner = sourceRepoOwner;
      if (sourceRepoName !== undefined) updates.sourceRepoName = sourceRepoName;
      if (sourceRepoBranch !== undefined) updates.sourceRepoBranch = sourceRepoBranch;
      if (webhookSecret !== undefined) updates.webhookSecret = webhookSecret;
      if (autoAnalyzeCommits !== undefined) updates.autoAnalyzeCommits = autoAnalyzeCommits;
      if (sourceProvider !== undefined) updates.sourceProvider = sourceProvider;
      if (repoUrl !== undefined) updates.repoUrl = repoUrl;
      if (repoId !== undefined) updates.repoId = repoId;

      await config.update(updates);

      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
