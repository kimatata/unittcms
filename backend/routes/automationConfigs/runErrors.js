import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from './_credentials.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.get('/:id/run-errors', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Not found');
      if (config.provider !== 'github' || !config.repoUrl) {
        return res.status(400).send('Only GitHub repos are supported');
      }

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { owner, repo } = parseRepoUrl(config.repoUrl);
      const token = credentials.token;

      const runsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
        { headers: githubHeaders(token) }
      );
      if (!runsRes.ok) return res.status(502).send('Failed to fetch runs from GitHub');
      const { workflow_runs: runs } = await runsRes.json();
      if (!runs?.length) return res.json([]);

      const latestRun = runs[0];
      if (latestRun.conclusion !== 'failure') return res.json([]);

      const jobsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRun.id}/jobs`,
        { headers: githubHeaders(token) }
      );
      if (!jobsRes.ok) return res.status(502).send('Failed to fetch jobs from GitHub');
      const { jobs } = await jobsRes.json();

      const failedJobs = jobs.filter((j) => j.conclusion === 'failure');
      if (!failedJobs.length) return res.json([]);

      const errors = [];
      for (const job of failedJobs) {
        const logsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${job.id}/logs`,
          { headers: githubHeaders(token) }
        );
        if (!logsRes.ok) continue;
        const logText = await logsRes.text();
        const parsed = parseErrors(logText, config.automationTool, job.id, job.name);
        errors.push(...parsed);
      }

      res.json(errors);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}

function parseRepoUrl(repoUrl) {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) throw new Error('Cannot parse GitHub repo URL: ' + repoUrl);
  return { owner: match[1], repo: match[2] };
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function parseErrors(logText, tool, jobId, jobName) {
  if (tool === 'pytest') return parsePytest(logText, jobId, jobName);
  if (tool === 'cypress') return parseCypress(logText, jobId, jobName);
  return parsePlaywright(logText, jobId, jobName);
}

function parsePlaywright(log, jobId, jobName) {
  const errors = [];
  const lines = log.split('\n');
  let idx = 0;

  while (idx < lines.length) {
    const line = stripAnsi(lines[idx]);
    const failMatch = line.match(/(?:[✘×]|FAILED)\s+(.+?)(?:\s+\(\d+(?:\.\d+)?(?:ms|s)\))?$/);
    if (failMatch) {
      const testName = failMatch[1].trim();
      const errorLines = [line];
      let filePath = null;
      idx++;
      while (idx < lines.length) {
        const next = stripAnsi(lines[idx]);
        if (/(?:[✘×✓]|FAILED|PASSED)\s+/.test(next) && next.trim() !== '') break;
        errorLines.push(next);
        if (!filePath) {
          const fileMatch = next.match(/\(([^)]+\.(?:ts|js|tsx|jsx):\d+:\d+)\)/);
          if (fileMatch) filePath = fileMatch[1].replace(/:\d+:\d+$/, '');
        }
        idx++;
      }
      errors.push({
        id: `${jobId}-${errors.length}`,
        jobId,
        jobName,
        testName,
        filePath: filePath || null,
        errorText: errorLines.join('\n').trim(),
      });
    } else {
      idx++;
    }
  }
  return errors;
}

function parsePytest(log, jobId, jobName) {
  const errors = [];
  const lines = log.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = stripAnsi(lines[i]);
    const match = line.match(/^FAILED\s+([\w/\\.-]+(?:::\w+)+)\s*(?:-\s*(.+))?$/);
    if (match) {
      const fullRef = match[1];
      const errorMsg = match[2] || '';
      const filePath = fullRef.split('::')[0];
      const testName = fullRef.split('::').slice(1).join(' > ');
      errors.push({
        id: `${jobId}-${errors.length}`,
        jobId,
        jobName,
        testName,
        filePath,
        errorText: `FAILED ${fullRef}${errorMsg ? ' - ' + errorMsg : ''}`,
      });
    }
  }
  return errors;
}

function parseCypress(log, jobId, jobName) {
  const errors = [];
  const lines = log.split('\n');
  let idx = 0;

  while (idx < lines.length) {
    const line = stripAnsi(lines[idx]);
    const failMatch = line.match(/^\s+\d+\)\s+(.+)$/);
    if (failMatch) {
      const testName = failMatch[1].trim();
      const errorLines = [line];
      let filePath = null;
      idx++;
      while (idx < lines.length) {
        const next = stripAnsi(lines[idx]);
        if (/^\s+\d+\)\s+/.test(next) && next.trim() !== '') break;
        errorLines.push(next);
        if (!filePath) {
          const fileMatch = next.match(/(?:at\s+)?([^\s(]+\.(?:cy\.ts|cy\.js|spec\.ts|spec\.js))(?::\d+)?/);
          if (fileMatch) filePath = fileMatch[1];
        }
        idx++;
      }
      errors.push({
        id: `${jobId}-${errors.length}`,
        jobId,
        jobName,
        testName,
        filePath: filePath || null,
        errorText: errorLines.join('\n').trim(),
      });
    } else {
      idx++;
    }
  }
  return errors;
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '').replace(/^\d{4}-\d{2}-\d{2}T[\d:.Z]+\s+/, '');
}
