import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { slugify, buildNodeScannerScript, buildPythonScannerScript, buildCIWorkflow } from './_builders.js';
import { loadProviderCredentials } from './_credentials.js';

function buildFolderTree(folders, cases, parentId = null) {
  return folders
    .filter((f) => (f.parentFolderId ?? null) === parentId)
    .map((f) => ({
      id: f.id,
      name: f.name,
      cases: cases.filter((c) => c.folderId === f.id),
      children: buildFolderTree(folders, cases, f.id),
    }));
}

function generatePlaywrightTS(node, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  const lines = [];
  for (const c of node.cases) {
    const tagOption =
      c.tags && c.tags.length > 0
        ? `, { tag: [${c.tags.map((t) => `'@${t}'`).join(', ')}] }`
        : '';
    lines.push(`${indent}test('${c.title.replace(/'/g, "\\'")}${tagOption}, async ({ page }) => {`);
    lines.push(`${indent}  // @unittcms:caseId:${c.id}`);
    if (c.tags && c.tags.length > 0) lines.push(`${indent}  // @unittcms:tags:${c.tags.join(',')}`);
    if (c.preConditions) lines.push(`${indent}  // Pre-conditions: ${c.preConditions}`);
    lines.push(`${indent}  // TODO: implement`);
    lines.push(`${indent}});`);
    lines.push('');
  }
  for (const child of node.children) {
    lines.push(`${indent}test.describe('${child.name.replace(/'/g, "\\'")}', () => {`);
    lines.push(generatePlaywrightTS(child, indentLevel + 1));
    lines.push(`${indent}});`);
    lines.push('');
  }
  return lines.join('\n');
}


function buildTemplateFiles(tool, language, projectName, folderTree, provider) {
  const files = [];
  const ciFile = buildCIWorkflow(tool, language, provider);
  if (ciFile) files.push(ciFile);

  if (tool === 'playwright' && language === 'typescript') {
    files.push({
      path: 'package.json',
      content: JSON.stringify(
        {
          name: slugify(projectName),
          version: '1.0.0',
          scripts: { test: 'playwright test', 'test:report': 'playwright show-report', sync: 'node scripts/unittcms-sync.mjs' },
          devDependencies: { '@playwright/test': '^1.44.0', '@types/node': '^20.0.0', typescript: '^5.0.0' },
        },
        null,
        2
      ),
    });
    files.push({ path: 'scripts/unittcms-sync.mjs', content: buildNodeScannerScript() });
    files.push({
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`,
    });
    files.push({
      path: 'tsconfig.json',
      content: JSON.stringify(
        { compilerOptions: { target: 'ES2020', module: 'commonjs', strict: true, esModuleInterop: true }, include: ['**/*.ts'], exclude: ['node_modules'] },
        null,
        2
      ),
    });
    files.push({ path: '.gitignore', content: `node_modules/\ntest-results/\nplaywright-report/\nblob-report/\nplaywright/.cache/\n` });
    for (const folder of folderTree) {
      const slug = slugify(folder.name);
      files.push({
        path: `tests/${slug}.spec.ts`,
        content: `import { test } from '@playwright/test';\n\ntest.describe('${folder.name.replace(/'/g, "\\'")}', () => {\n${generatePlaywrightTS(folder, 1)}});\n`,
      });
    }
  } else if (tool === 'playwright' && language === 'javascript') {
    files.push({
      path: 'package.json',
      content: JSON.stringify(
        { name: slugify(projectName), version: '1.0.0', scripts: { test: 'playwright test', 'test:report': 'playwright show-report', sync: 'node scripts/unittcms-sync.mjs' }, devDependencies: { '@playwright/test': '^1.44.0' } },
        null,
        2
      ),
    });
    files.push({ path: 'scripts/unittcms-sync.mjs', content: buildNodeScannerScript() });
    files.push({
      path: 'playwright.config.js',
      content: `const { defineConfig, devices } = require('@playwright/test');\n\nmodule.exports = defineConfig({\n  testDir: './tests',\n  fullyParallel: true,\n  retries: process.env.CI ? 2 : 0,\n  reporter: 'html',\n  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },\n  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],\n});\n`,
    });
    files.push({ path: '.gitignore', content: `node_modules/\ntest-results/\nplaywright-report/\n` });
    for (const folder of folderTree) {
      const slug = slugify(folder.name);
      files.push({
        path: `tests/${slug}.spec.js`,
        content: `const { test } = require('@playwright/test');\n\ntest.describe('${folder.name.replace(/'/g, "\\'")}', () => {\n${generatePlaywrightTS(folder, 1)}});\n`,
      });
    }
  } else if (tool === 'pytest') {
    files.push({ path: 'pytest.ini', content: `[pytest]\ntestpaths = tests\n` });
    files.push({ path: 'conftest.py', content: `import pytest\n\n# Add shared fixtures here\n` });
    files.push({ path: 'requirements.txt', content: `pytest>=7.0\npytest-playwright>=0.4\nplaywright>=1.44\n` });
    files.push({ path: '.gitignore', content: `__pycache__/\n*.pyc\n.pytest_cache/\ntest-results/\n` });
    files.push({ path: 'scripts/unittcms_sync.py', content: buildPythonScannerScript() });
    for (const folder of folderTree) {
      const slug = slugify(folder.name).replace(/-/g, '_');
      const lines = ['import pytest', ''];
      for (const c of folder.cases) {
        const tagsArg =
          c.tags && c.tags.length > 0
            ? `, tags=[${c.tags.map((t) => `"${t}"`).join(', ')}]`
            : '';
        lines.push(`@pytest.mark.unittcms(case_id=${c.id}${tagsArg})`);
        lines.push(`def test_${slugify(c.title).replace(/-/g, '_')}(page):`);
        if (c.preConditions) lines.push(`    # Pre-conditions: ${c.preConditions}`);
        lines.push(`    # TODO: implement`);
        lines.push(`    pass`);
        lines.push('');
      }
      files.push({ path: `tests/test_${slug}.py`, content: lines.join('\n') });
    }
  }

  return files;
}

// ── GitLab ────────────────────────────────────────────────────────────────────

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

async function pushToGitlab(apiBase, token, projectName, repoId, repoUrl, files, readmeContent) {
  let glProjectId = repoId;
  let glProjectUrl = repoUrl;

  if (!glProjectId) {
    const created = await glRequest('POST', `${apiBase}/projects`, token, {
      name: projectName,
      path: slugify(projectName),
      initialize_with_readme: true,
    });
    glProjectId = created.id;
    glProjectUrl = created.web_url;
  }

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
  actions.push({ action: existingPaths.has('README.md') ? 'update' : 'create', file_path: 'README.md', content: readmeContent });

  await glRequest('POST', `${apiBase}/projects/${glProjectId}/repository/commits`, token, {
    branch: 'main',
    commit_message: 'chore: sync automation stubs from UnitTCMS',
    actions,
  });

  return { repoId: glProjectId, repoUrl: glProjectUrl };
}

// ── GitHub ────────────────────────────────────────────────────────────────────

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

async function pushToGithub(apiBase, token, namespace, projectName, repoId, repoUrl, files, readmeContent) {
  let owner = namespace;
  if (!owner) {
    const user = await ghRequest('GET', `${apiBase}/user`, token, null);
    owner = user.login;
  }

  const repoSlug = slugify(projectName);
  let ghRepoId = repoId;
  let ghRepoUrl = repoUrl;

  if (!ghRepoId) {
    let repo;
    try {
      repo = await ghRequest('POST', `${apiBase}/user/repos`, token, {
        name: repoSlug,
        description: `Automation project generated by UnitTCMS`,
        private: false,
        auto_init: true,
      });
    } catch (err) {
      if (err.message.includes('422') || err.message.includes('already exists')) {
        repo = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}`, token, null);
      } else {
        throw err;
      }
    }
    ghRepoId = repo.id;
    ghRepoUrl = repo.html_url;
  }

  const refsData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/ref/heads/main`, token, null);
  const headSha = refsData.object.sha;
  const commitData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/commits/${headSha}`, token, null);
  const baseTreeSha = commitData.tree.sha;

  const allFiles = [...files, { path: 'README.md', content: readmeContent }];
  const treeEntries = await Promise.all(
    allFiles.map(async (f) => {
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
    message: 'chore: sync automation stubs from UnitTCMS',
    tree: newTree.sha,
    parents: [headSha],
  });

  await ghRequest('PATCH', `${apiBase}/repos/${owner}/${repoSlug}/git/refs/heads/main`, token, {
    sha: newCommit.sha,
  });

  return { repoId: ghRepoId, repoUrl: ghRepoUrl };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/:id/generate', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { repoName, automationTool, automationLanguage, projectId, provider } = config;
      const { token, instanceUrl, namespace } = credentials;
      const projectName = repoName || `automation-${projectId}`;

      const folders = await db.repos.folders.findAll({ where: { projectId }, raw: true });
      const caseObjs = await db.repos.cases.findAll({
        where: { folderId: folders.map((f) => f.id) },
        include: [{ model: db.repos.tags, as: 'Tags', through: { attributes: [] } }],
      });
      const cases = caseObjs.map((c) => {
        const plain = c.toJSON();
        plain.tags = (plain.Tags || []).map((t) => t.name);
        return plain;
      });
      const folderTree = buildFolderTree(folders, cases);
      const files = buildTemplateFiles(automationTool, automationLanguage, projectName, folderTree, provider);

      const isGitlab = !provider || provider === 'gitlab';
      const readmeContent = `# ${projectName}\n\nAutomation project generated by UnitTCMS.\n\n**Tool:** ${automationTool}  \n**Language:** ${automationLanguage}\n`;

      let result;
      if (isGitlab) {
        result = await pushToGitlab(`${instanceUrl}/api/v4`, token, projectName, config.repoId, config.repoUrl, files, readmeContent);
      } else {
        const ghApiBase = instanceUrl.includes('github.com') ? 'https://api.github.com' : `${instanceUrl}/api/v3`;
        result = await pushToGithub(ghApiBase, token, namespace, projectName, config.repoId, config.repoUrl, files, readmeContent);
      }

      await config.update({ repoId: result.repoId, repoUrl: result.repoUrl });

      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
