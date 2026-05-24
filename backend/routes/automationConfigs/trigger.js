import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';
import { repairConfig } from './repair.js';

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

async function dispatchWorkflow(token, owner, repoSlug) {
  await ghRequest(
    'POST',
    `https://api.github.com/repos/${owner}/${repoSlug}/actions/workflows/tests.yml/dispatches`,
    token,
    { ref: 'main' }
  );
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  // POST /api/automation-configs/:id/trigger
  // Dispatches the tests.yml workflow via GitHub workflow_dispatch.
  // If the workflow file is missing (404), auto-repairs core files first then retries.
  router.post('/:id/trigger', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.gitlabToken) return res.status(400).send('No token configured');
      if (config.provider !== 'github') return res.status(400).send('Trigger only supported for GitHub');
      if (!config.repoUrl) return res.status(400).send('No repository linked yet — generate the project first');

      const { gitlabToken: token } = config;
      const [owner, repoSlug] = config.repoUrl.replace('https://github.com/', '').split('/');

      try {
        await dispatchWorkflow(token, owner, repoSlug);
      } catch (err) {
        // Workflow file missing — push core files and retry once
        if (err.message.includes('404')) {
          console.log(`[trigger] workflow not found, auto-repairing core files for ${owner}/${repoSlug}`);
          await repairConfig(config);
          // GitHub needs a moment to register the new workflow file
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await dispatchWorkflow(token, owner, repoSlug);
          return res.json({ triggered: true, autoRepaired: true });
        }
        throw err;
      }

      res.json({ triggered: true, autoRepaired: false });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
