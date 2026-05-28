import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { repairConfig } from './repair.js';
import { loadProviderCredentials } from './_credentials.js';
import { slugify } from './_builders.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildGrepFilter(tool, titles) {
  if (!titles || titles.length === 0) return '';
  if (tool === 'pytest') {
    const fnNames = titles.map(
      (t) => 'test_' + slugify(t).replace(/-/g, '_')
    );
    return fnNames.join(' or ');
  }
  // playwright / cypress: --grep takes a regex
  return titles.map(escapeRegex).join('|');
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

async function dispatchWorkflow(token, owner, repoSlug, grepFilter = '') {
  const body = { ref: 'main' };
  if (grepFilter) body.inputs = { grep_filter: grepFilter };
  await ghRequest(
    'POST',
    `https://api.github.com/repos/${owner}/${repoSlug}/actions/workflows/tests.yml/dispatches`,
    token,
    body
  );
}

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // POST /api/automation-configs/:id/trigger
  // Body (optional): { mode: 'all'|'specific'|'testRun', caseIds?: number[], runId?: number }
  router.post('/:id/trigger', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (config.provider !== 'github') return res.status(400).send('Trigger only supported for GitHub');
      if (!config.repoUrl) return res.status(400).send('No repository linked yet — generate the project first');

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { token } = credentials;
      const [owner, repoSlug] = config.repoUrl.replace('https://github.com/', '').split('/');

      // Build grep filter based on requested mode
      const { mode = 'all', caseIds, runId } = req.body || {};
      let grepFilter = '';

      if (mode === 'specific' && Array.isArray(caseIds) && caseIds.length > 0) {
        const cases = await db.repos.cases.findAll({
          where: { id: caseIds },
          attributes: ['title'],
        });
        grepFilter = buildGrepFilter(config.automationTool, cases.map((c) => c.title));
      } else if (mode === 'testRun' && runId) {
        const runCases = await db.repos.runCases.findAll({
          where: { runId },
          include: [{ model: db.repos.cases, required: false }],
        });
        const implementedTitles = runCases
          .map((rc) => rc.Case)
          .filter((c) => c && c.codeStatus === 'implemented')
          .map((c) => c.title);
        grepFilter = buildGrepFilter(config.automationTool, implementedTitles);
      }

      try {
        await dispatchWorkflow(token, owner, repoSlug, grepFilter);
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('422')) {
          console.log(`[trigger] workflow not found, auto-repairing core files for ${owner}/${repoSlug}`);
          await repairConfig(config, credentials);
          await new Promise((resolve) => setTimeout(resolve, 3000));
          await dispatchWorkflow(token, owner, repoSlug, grepFilter);
          return res.json({ triggered: true, autoRepaired: true });
        }
        throw err;
      }

      res.json({ triggered: true, autoRepaired: false });
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
