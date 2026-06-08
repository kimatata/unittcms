import express from 'express';
import crypto from 'crypto';
const router = express.Router();

function verifyGitHubSignature(secret, payload, signature) {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function verifyGitLabToken(secret, token) {
  return token === secret;
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
  // Note: raw body needed for HMAC verification — must be before express.json() parses it.
  // We use express.raw() selectively on this route.
  router.post('/:id/webhook', express.raw({ type: '*/*' }), async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const rawBody = req.body.toString('utf-8');
      const payload = JSON.parse(rawBody);

      // Signature verification (if secret is configured)
      if (config.webhookSecret) {
        const isGitHub = config.provider === 'github';
        if (isGitHub) {
          const sig = req.headers['x-hub-signature-256'];
          if (!verifyGitHubSignature(config.webhookSecret, rawBody, sig)) {
            return res.status(401).send('Invalid webhook signature');
          }
        } else {
          const token = req.headers['x-gitlab-token'];
          if (!verifyGitLabToken(config.webhookSecret, token)) {
            return res.status(401).send('Invalid webhook token');
          }
        }
      }

      // Parse commits from payload
      const isGitHub = config.provider === 'github';
      let rawCommits = [];

      if (isGitHub) {
        // GitHub push event: payload.commits array
        rawCommits = (payload.commits || []).map((c) => ({
          sha: c.id,
          message: c.message,
          author: c.author?.name,
          committedAt: c.timestamp,
        }));
      } else {
        // GitLab push event: payload.commits array
        rawCommits = (payload.commits || []).map((c) => ({
          sha: c.id,
          message: c.message,
          author: c.author?.name,
          committedAt: c.timestamp,
        }));
      }

      if (rawCommits.length === 0) {
        return res.json({ processed: 0 });
      }

      // Load credentials for diff fetching
      const integration = await db.repos.integrationConfigs.findOne({
        where: { projectId: config.projectId, service: config.provider },
      });
      const token = integration?.apiKey;
      const instanceUrl = integration?.settings?.instanceUrl || (isGitHub ? 'https://github.com' : 'https://gitlab.com');
      const namespace = integration?.settings?.namespace;
      const apiBase = isGitHub
        ? (instanceUrl.includes('github.com') ? 'https://api.github.com' : `${instanceUrl}/api/v3`)
        : `${instanceUrl}/api/v4`;

      const owner = config.sourceRepoOwner || namespace;
      const repoName = config.sourceRepoName;

      let added = 0;
      const newShas = [];

      for (const raw of rawCommits) {
        const existing = await db.repos.sourceCommits.findOne({
          where: { automationConfigId: config.id, sha: raw.sha },
        });
        if (existing) continue;

        let diff = null;
        if (token && repoName) {
          try {
            if (isGitHub) {
              const resolvedNamespace = owner || (await ghRequest('GET', `${apiBase}/user`, token, null)).login;
              const commitDetail = await ghRequest('GET', `${apiBase}/repos/${resolvedNamespace}/${repoName}/commits/${raw.sha}`, token, null);
              diff = (commitDetail.files || [])
                .map((f) => `diff --git a/${f.filename} b/${f.filename}\n${f.patch || ''}`)
                .join('\n\n');
            } else {
              const encoded = encodeURIComponent(`${owner}/${repoName}`);
              const project = await glRequest('GET', `${apiBase}/projects/${encoded}`, token, null);
              const diffData = await glRequest('GET', `${apiBase}/projects/${project.id}/repository/commits/${raw.sha}/diff`, token, null);
              diff = (Array.isArray(diffData) ? diffData : [])
                .map((f) => `diff --git a/${f.old_path} b/${f.new_path}\n${f.diff || ''}`)
                .join('\n\n');
            }
          } catch (_) {}
        }

        await db.repos.sourceCommits.create({
          automationConfigId: config.id,
          sha: raw.sha,
          message: raw.message,
          author: raw.author,
          committedAt: raw.committedAt,
          diff,
          status: 'new',
        });
        added++;
        newShas.push(raw.sha);
      }

      await db.repos.syncLogs.create({
        automationConfigId: config.id,
        type: 'webhook',
        description: `Webhook: received ${rawCommits.length} commits, stored ${added} new`,
        created: added,
        status: 'success',
      });

      res.json({ processed: rawCommits.length, added, newShas });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
