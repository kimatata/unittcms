import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import defineFolder from '../../models/folders.js';
import defineCase from '../../models/cases.js';
import authMiddleware from '../../middleware/auth.js';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
    lines.push(`${indent}test('${c.title.replace(/'/g, "\\'")}', async ({ page }) => {`);
    lines.push(`${indent}  // @unittcms:caseId:${c.id}`);
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

function buildNodeScannerScript() {
  return `#!/usr/bin/env node
/**
 * UnitTCMS sync — scans test files for @unittcms:caseId annotations and
 * reports implementation status back to UnitTCMS.
 *
 * Required env vars:
 *   UNITTCMS_URL        e.g. http://localhost:8000
 *   UNITTCMS_TOKEN      Bearer token for a UnitTCMS user
 *   UNITTCMS_PROJECT_ID numeric project ID
 *
 * Run: node scripts/unittcms-sync.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

const { UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID } = process.env;
if (!UNITTCMS_URL || !UNITTCMS_TOKEN || !UNITTCMS_PROJECT_ID) {
  console.error('Missing env vars: UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID');
  process.exit(1);
}

let commitSha = '';
try { commitSha = execSync('git rev-parse HEAD').toString().trim(); } catch (_) {}

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory() && entry !== 'node_modules') out.push(...walk(p, exts));
    else if (exts.some((e) => entry.endsWith(e))) out.push(p);
  }
  return out;
}

function isStub(lines, annotationIdx) {
  const meaningful = lines
    .slice(annotationIdx + 1)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && l !== '});' && l !== '}');
  return meaningful.length === 0;
}

const cases = [];
const testDir = join(process.cwd(), 'tests');
for (const file of walk(testDir, ['.spec.ts', '.spec.js'])) {
  const lines = readFileSync(file, 'utf-8').split('\\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\\/\\/ @unittcms:caseId:(\\d+)/);
    if (m) {
      cases.push({
        caseId: parseInt(m[1], 10),
        status: isStub(lines, i) ? 'stub' : 'implemented',
        filePath: relative(process.cwd(), file),
      });
    }
  }
}

const res = await fetch(\`\${UNITTCMS_URL}/api/automation-configs/sync-status\`, {
  method: 'POST',
  headers: { Authorization: \`Bearer \${UNITTCMS_TOKEN}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectId: UNITTCMS_PROJECT_ID, commitSha, cases }),
});
if (!res.ok) { console.error('Sync failed:', await res.text()); process.exit(1); }
const data = await res.json();
console.log(\`UnitTCMS sync: \${data.updated} cases updated (commit \${commitSha.slice(0, 7)})\`);
`;
}

function buildPythonScannerScript() {
  return `#!/usr/bin/env python3
"""
UnitTCMS sync -- scans pytest files for @pytest.mark.unittcms annotations and
reports implementation status back to UnitTCMS.

Required env vars:
  UNITTCMS_URL        e.g. http://localhost:8000
  UNITTCMS_TOKEN      Bearer token for a UnitTCMS user
  UNITTCMS_PROJECT_ID numeric project ID

Run: python scripts/unittcms_sync.py
"""
import os, re, subprocess, json
from pathlib import Path
import urllib.request

UNITTCMS_URL = os.environ.get('UNITTCMS_URL', '')
UNITTCMS_TOKEN = os.environ.get('UNITTCMS_TOKEN', '')
UNITTCMS_PROJECT_ID = os.environ.get('UNITTCMS_PROJECT_ID', '')

if not all([UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID]):
    raise SystemExit('Missing env vars: UNITTCMS_URL, UNITTCMS_TOKEN, UNITTCMS_PROJECT_ID')

try:
    commit_sha = subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode().strip()
except Exception:
    commit_sha = ''

MARK_RE = re.compile(r'@pytest\\.mark\\.unittcms\\(case_id=(\\d+)\\)')

def is_stub(lines, func_idx):
    indent = len(lines[func_idx]) - len(lines[func_idx].lstrip())
    for line in lines[func_idx + 1:]:
        s = line.strip()
        if not s or s.startswith('#'):
            continue
        if len(line) - len(line.lstrip()) <= indent:
            break
        if s != 'pass':
            return False
    return True

root = Path.cwd()
cases = []
for pyfile in root.rglob('test_*.py'):
    lines = pyfile.read_text().splitlines()
    for i, line in enumerate(lines):
        m = MARK_RE.search(line)
        if m:
            func_idx = next((j for j in range(i + 1, len(lines)) if lines[j].strip().startswith('def ')), None)
            stub = is_stub(lines, func_idx) if func_idx is not None else True
            cases.append({
                'caseId': int(m.group(1)),
                'status': 'stub' if stub else 'implemented',
                'filePath': str(pyfile.relative_to(root)),
            })

body = json.dumps({'projectId': UNITTCMS_PROJECT_ID, 'commitSha': commit_sha, 'cases': cases}).encode()
req = urllib.request.Request(
    f'{UNITTCMS_URL}/api/automation-configs/sync-status',
    data=body,
    headers={'Authorization': f'Bearer {UNITTCMS_TOKEN}', 'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())
print(f"UnitTCMS sync: {data['updated']} cases updated (commit {commit_sha[:7]})")
`;
}

function buildTemplateFiles(tool, language, projectName, folderTree) {
  const files = [];

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
        lines.push(`@pytest.mark.unittcms(case_id=${c.id})`);
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
    // try to create; if it exists already, fetch it
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

  // get HEAD commit SHA and tree SHA of default branch
  const refsData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/ref/heads/main`, token, null);
  const headSha = refsData.object.sha;
  const commitData = await ghRequest('GET', `${apiBase}/repos/${owner}/${repoSlug}/git/commits/${headSha}`, token, null);
  const baseTreeSha = commitData.tree.sha;

  // create blobs for all files
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

  // create tree
  const newTree = await ghRequest('POST', `${apiBase}/repos/${owner}/${repoSlug}/git/trees`, token, {
    base_tree: baseTreeSha,
    tree: treeEntries,
  });

  // create commit
  const newCommit = await ghRequest('POST', `${apiBase}/repos/${owner}/${repoSlug}/git/commits`, token, {
    message: 'chore: sync automation stubs from UnitTCMS',
    tree: newTree.sha,
    parents: [headSha],
  });

  // update ref
  await ghRequest('PATCH', `${apiBase}/repos/${owner}/${repoSlug}/git/refs/heads/main`, token, {
    sha: newCommit.sha,
  });

  return { repoId: ghRepoId, repoUrl: ghRepoUrl };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);

  router.post('/:id/generate', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const { gitlabUrl, gitlabToken, gitlabNamespace, repoName, automationTool, automationLanguage, projectId, provider } = config;
      const projectName = repoName || `automation-${projectId}`;

      // fetch folder/case hierarchy
      const folders = await Folder.findAll({ where: { projectId }, raw: true });
      const cases = await Case.findAll({ where: { folderId: folders.map((f) => f.id) }, raw: true });
      const folderTree = buildFolderTree(folders, cases);
      const files = buildTemplateFiles(automationTool, automationLanguage, projectName, folderTree);

      const isGitlab = !provider || provider === 'gitlab';
      const baseUrl = gitlabUrl || (isGitlab ? 'https://gitlab.com' : 'https://github.com');
      const readmeContent = `# ${projectName}\n\nAutomation project generated by UnitTCMS.\n\n**Tool:** ${automationTool}  \n**Language:** ${automationLanguage}\n`;

      let result;
      if (isGitlab) {
        result = await pushToGitlab(`${baseUrl}/api/v4`, gitlabToken, projectName, config.repoId, config.repoUrl, files, readmeContent);
      } else {
        const ghApiBase = baseUrl.includes('github.com') ? 'https://api.github.com' : `${baseUrl}/api/v3`;
        result = await pushToGithub(ghApiBase, gitlabToken, gitlabNamespace, projectName, config.repoId, config.repoUrl, files, readmeContent);
      }

      await config.update({ repoId: result.repoId, repoUrl: result.repoUrl });

      const data = config.toJSON();
      data.gitlabToken = '***';
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
