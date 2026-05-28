import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from './_credentials.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // DELETE /api/automation-configs/:id/repo
  router.delete('/:id/repo', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.repoUrl) return res.status(400).send('No repository linked');

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { token, instanceUrl } = credentials;
      const { provider, repoUrl, repoId } = config;
      const isGitlab = !provider || provider === 'gitlab';

      if (isGitlab) {
        const baseUrl = instanceUrl || 'https://gitlab.com';
        const delRes = await fetch(`${baseUrl}/api/v4/projects/${repoId}`, {
          method: 'DELETE',
          headers: { 'PRIVATE-TOKEN': token },
        });
        if (!delRes.ok && delRes.status !== 404) {
          const text = await delRes.text();
          throw new Error(`GitLab ${delRes.status}: ${text}`);
        }
      } else {
        const [owner, repoSlug] = repoUrl.replace('https://github.com/', '').split('/');
        const delRes = await fetch(`https://api.github.com/repos/${owner}/${repoSlug}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'UnitTCMS',
          },
        });
        if (!delRes.ok && delRes.status !== 404) {
          const text = await delRes.text();
          throw new Error(`GitHub ${delRes.status}: ${text}`);
        }
      }

      await config.update({ repoUrl: null, repoId: null });
      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      const msg = error.message || 'Internal Server Error';
      if (msg.includes('401') || msg.includes('403')) {
        return res
          .status(401)
          .send('Token lacks permission to delete repositories — check repo delete scope in the Integrations tab');
      }
      res.status(500).send(msg);
    }
  });

  return router;
}
