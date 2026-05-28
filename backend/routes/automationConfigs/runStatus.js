import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from './_credentials.js';

async function ghRequest(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'UnitTCMS',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${text}`);
  return JSON.parse(text);
}

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /api/automation-configs/:id/run-status
  router.get('/:id/run-status', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (config.provider !== 'github') return res.status(400).send('Run status only supported for GitHub');
      if (!config.repoUrl) return res.json({ status: null });

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { token } = credentials;
      const [owner, repoSlug] = config.repoUrl.replace('https://github.com/', '').split('/');

      const data = await ghRequest(
        'GET',
        `https://api.github.com/repos/${owner}/${repoSlug}/actions/runs?per_page=1`,
        token,
        null
      );

      const run = data.workflow_runs?.[0] ?? null;
      if (!run) return res.json({ status: null });

      res.json({
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        runAt: run.created_at,
        commitSha: run.head_sha?.slice(0, 7),
      });
    } catch (error) {
      console.error(error);
      const msg = error.message || 'Internal Server Error';
      if (msg.includes('401')) {
        return res.status(401).send('Token is invalid or expired — update it in the Integrations tab');
      }
      res.status(500).send(msg);
    }
  });

  return router;
}
