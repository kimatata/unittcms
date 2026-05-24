import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';
import { buildCoreFiles } from './_builders.js';

// ── GitHub push helpers ───────────────────────────────────────────────────────

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

async function pushCoreFilesToGithub(token, owner, repoSlug, files) {
  const apiBase = 'https://api.github.com';

  const refsData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/ref/heads/main`, token, null);
  const headSha = refsData.object.sha;
  const commitData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/commits/${headSha}`, token, null);
  const baseTreeSha = commitData.tree.sha;

  const treeEntries = await Promise.all(
    files.map(async (f) => {
      const blob = await ghRequest('POST', `${apiBase}/repos/${owner}/${repoSlug}/git/blobs`, token, {
        content: f.content,
        encoding: 'utf-8',
      });
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  const newTree = await ghRequest('POST', `${apiBase}/repos/${owner}/${repoSlug}/git/trees`, token, {
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  const newCommit = await ghRequest('POST', `${apiBase}/repos/${owner}/${repoSlug}/git/commits`, token, {
    message: 'chore: repair UnitTCMS core automation files',
    tree: newTree.sha,
    parents: [headSha],
  });

  await ghRequest('PATCH', `${apiBase}/repos/${owner}/${repoSlug}/git/refs/heads/main`, token, {
    sha: newCommit.sha,
  });
}

// ── GitLab push helpers ───────────────────────────────────────────────────────

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

async function pushCoreFilesToGitlab(apiBase, token, glProjectId, files) {
  const existingPaths = new Set();
  try {
    const tree = await glRequest('GET', `${apiBase}/projects/${glProjectId}/repository/tree?recursive=true&per_page=100`, token, null);
    for (const item of tree) if (item.type === 'blob') existingPaths.add(item.path);
  } catch (_) {}

  const actions = files.map((f) => ({
    action: existingPaths.has(f.path) ? 'update' : 'create',
    file_path: f.path,
    content: f.content,
  }));

  await glRequest('POST', `${apiBase}/projects/${glProjectId}/repository/commits`, token, {
    branch: 'main',
    commit_message: 'chore: repair UnitTCMS core automation files',
    actions,
  });
}

// ── Shared repair logic (exported for use by trigger.js) ─────────────────────

export async function repairConfig(config) {
  const { gitlabToken: token, automationTool, automationLanguage, provider, repoUrl, repoId, gitlabUrl } = config;

  if (!repoUrl) throw new Error('No repository linked yet — generate the project first');

  const files = buildCoreFiles(automationTool, automationLanguage, provider);
  const isGitlab = !provider || provider === 'gitlab';

  if (isGitlab) {
    const baseUrl = gitlabUrl || 'https://gitlab.com';
    await pushCoreFilesToGitlab(`${baseUrl}/api/v4`, token, repoId, files);
  } else {
    // Parse owner/repo from stored repoUrl e.g. https://github.com/owner/repo
    const [owner, repoSlug] = repoUrl.replace('https://github.com/', '').split('/');
    await pushCoreFilesToGithub(token, owner, repoSlug, files);
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  // POST /api/automation-configs/:id/repair
  // Re-pushes scanner script and CI workflow to the connected repo.
  // Never touches test stubs — safe to call at any time.
  router.post('/:id/repair', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.gitlabToken) return res.status(400).send('No token configured');

      await repairConfig(config);
      res.json({ repaired: true });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
