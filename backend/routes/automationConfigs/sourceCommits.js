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

async function glRequest(method, url, token, body) {
  const res = await fetch(url, {
    method,
    headers: { 'PRIVATE-TOKEN': token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitLab ${res.status}: ${text}`);
  return JSON.parse(text);
}

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /:id/source-commits — list stored commits
  router.get('/:id/source-commits', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const commits = await db.repos.sourceCommits.findAll({
        where: { automationConfigId: config.id },
        order: [['committedAt', 'DESC']],
        limit: 50,
        attributes: ['id', 'sha', 'message', 'author', 'committedAt', 'status', 'aiSummary', 'generatedTestCaseIds', 'testCommitSha', 'createdAt'],
      });

      res.json(commits);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // POST /:id/sync-source-commits — fetch recent commits from source repo and store new ones
  router.post('/:id/sync-source-commits', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.sourceRepoName) return res.status(422).send('No source repository configured');

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { token, instanceUrl, namespace: credNamespace } = credentials;
      const isGitHub = config.provider === 'github';
      const apiBase = isGitHub
        ? (instanceUrl.includes('github.com') ? 'https://api.github.com' : `${instanceUrl}/api/v3`)
        : `${instanceUrl}/api/v4`;

      const owner = config.sourceRepoOwner || credNamespace;
      const repoName = config.sourceRepoName;
      const branch = config.sourceRepoBranch || 'main';

      let rawCommits = [];

      if (isGitHub) {
        const namespace = owner || (await ghRequest('GET', `${apiBase}/user`, token, null)).login;
        rawCommits = await ghRequest(
          'GET',
          `${apiBase}/repos/${namespace}/${repoName}/commits?sha=${branch}&per_page=30`,
          token,
          null
        );
      } else {
        // GitLab: find project by namespace/repoName
        const encoded = encodeURIComponent(`${owner}/${repoName}`);
        const project = await glRequest('GET', `${apiBase}/projects/${encoded}`, token, null);
        const projectId = project.id;
        rawCommits = await glRequest(
          'GET',
          `${apiBase}/projects/${projectId}/repository/commits?ref_name=${branch}&per_page=30`,
          token,
          null
        );
      }

      // Fetch diffs for new commits only
      let added = 0;
      for (const raw of rawCommits) {
        const sha = isGitHub ? raw.sha : raw.id;
        const existing = await db.repos.sourceCommits.findOne({
          where: { automationConfigId: config.id, sha },
        });
        if (existing) continue;

        let diff = null;
        try {
          if (isGitHub) {
            const namespace = owner || credNamespace;
            const commitDetail = await ghRequest(
              'GET',
              `${apiBase}/repos/${namespace}/${repoName}/commits/${sha}`,
              token,
              null
            );
            // Concatenate all file patches
            diff = (commitDetail.files || [])
              .map((f) => `diff --git a/${f.filename} b/${f.filename}\n${f.patch || ''}`)
              .join('\n\n');
          } else {
            const encoded = encodeURIComponent(`${owner}/${repoName}`);
            const project = await glRequest('GET', `${apiBase}/projects/${encoded}`, token, null);
            const diffData = await glRequest(
              'GET',
              `${apiBase}/projects/${project.id}/repository/commits/${sha}/diff`,
              token,
              null
            );
            diff = (Array.isArray(diffData) ? diffData : [])
              .map((f) => `diff --git a/${f.old_path} b/${f.new_path}\n${f.diff || ''}`)
              .join('\n\n');
          }
        } catch (_) {
          // Diff fetch failed — store commit without diff
        }

        await db.repos.sourceCommits.create({
          automationConfigId: config.id,
          sha,
          message: isGitHub ? raw.commit?.message : raw.message,
          author: isGitHub ? (raw.commit?.author?.name || raw.author?.login) : raw.author_name,
          committedAt: isGitHub ? raw.commit?.author?.date : raw.committed_date,
          diff,
          status: 'new',
        });
        added++;
      }

      await db.repos.syncLogs.create({
        automationConfigId: config.id,
        type: 'commit_sync',
        description: `Synced ${added} new commits from ${repoName}`,
        created: added,
        status: 'success',
      });

      // Auto-trigger analysis for new commits if enabled
      const newCommits = added > 0 && config.autoAnalyzeCommits
        ? await db.repos.sourceCommits.findAll({
            where: { automationConfigId: config.id, status: 'new' },
            order: [['committedAt', 'ASC']],
            limit: 5,
          })
        : [];

      res.json({ added, autoAnalyzeQueued: newCommits.map((c) => c.sha) });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // GET /:id/sync-logs — recent activity log
  router.get('/:id/sync-logs', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const logs = await db.repos.syncLogs.findAll({
        where: { automationConfigId: config.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      res.json(logs);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
