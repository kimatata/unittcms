import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
  return text ? JSON.parse(text) : null;
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  // POST /api/automation-configs/:id/trigger
  // Dispatches the tests.yml workflow via GitHub workflow_dispatch.
  router.post('/:id/trigger', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.gitlabToken) return res.status(400).send('No token configured');
      if (config.provider !== 'github') return res.status(400).send('Trigger only supported for GitHub');
      if (!config.repoUrl) return res.status(400).send('No repository linked yet — generate the project first');

      const { gitlabToken: token } = config;
      const [owner, repoSlug] = config.repoUrl.replace('https://github.com/', '').split('/');

      await ghRequest(
        'POST',
        `https://api.github.com/repos/${owner}/${repoSlug}/actions/workflows/tests.yml/dispatches`,
        token,
        { ref: 'main' }
      );

      res.json({ triggered: true });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
