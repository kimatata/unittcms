import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

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

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  // GET /api/automation-configs/:id/run-status
  // Returns the latest GitHub Actions run for the connected repo.
  router.get('/:id/run-status', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.gitlabToken) return res.status(400).send('No token configured');
      if (config.provider !== 'github') return res.status(400).send('Run status only supported for GitHub');
      if (!config.repoUrl) return res.json({ status: null });

      const { gitlabToken: token } = config;
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
        status: run.status,         // queued | in_progress | completed
        conclusion: run.conclusion, // success | failure | cancelled | null
        url: run.html_url,
        runAt: run.created_at,
        commitSha: run.head_sha?.slice(0, 7),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
