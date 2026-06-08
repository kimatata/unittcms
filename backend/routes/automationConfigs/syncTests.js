import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from './_credentials.js';
import { slugify } from './_builders.js';

// ── Title helpers ─────────────────────────────────────────────────────────────

function humanizeTitle(raw) {
  let s = raw.replace(/^test_?/, '');
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  s = s.replace(/[_-]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function humanizeFileName(filePath, tool) {
  const base = filePath.split('/').pop();
  let name = tool === 'pytest'
    ? base.replace(/^test_/, '').replace(/\.py$/, '')
    : base.replace(/\.spec\.(ts|js)$/, '');
  return humanizeTitle(name);
}

// ── Parsers for NEW (unannotated) tests ───────────────────────────────────────

function parseNewPlaywrightTests(content) {
  const lines = content.split('\n');
  const tests = [];
  const describeByIndent = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    const describeMatch = trimmed.match(/^test\.describe\(['"`](.*?)['"`]/);
    if (describeMatch) {
      describeByIndent[indent] = describeMatch[1];
      for (const k of Object.keys(describeByIndent)) {
        if (Number(k) > indent) delete describeByIndent[k];
      }
      continue;
    }

    const testMatch = trimmed.match(/^test\(['"`](.*?)['"`]/);
    if (testMatch) {
      const hasAnnotation = lines.slice(i + 1, i + 5).some((l) => /\/\/ @unittcms:caseId:/.test(l));
      if (!hasAnnotation) {
        const parentDescribes = Object.entries(describeByIndent)
          .filter(([k]) => Number(k) < indent)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, v]) => v);
        tests.push({ lineIndex: i, title: testMatch[1], describePath: parentDescribes });
      }
    }
  }

  return tests;
}

function parseNewPytestTests(content) {
  const lines = content.split('\n');
  const tests = [];
  for (let i = 0; i < lines.length; i++) {
    const funcMatch = lines[i].match(/^def (test_\w+)/);
    if (funcMatch) {
      const prevLines = lines.slice(Math.max(0, i - 3), i);
      const hasAnnotation = prevLines.some((l) => /@pytest\.mark\.unittcms/.test(l));
      if (!hasAnnotation) {
        tests.push({ lineIndex: i, title: funcMatch[1], describePath: [] });
      }
    }
  }
  return tests;
}

// ── Parsers for EXISTING (annotated) tests ────────────────────────────────────
// Returns [{ caseId, status: 'stub'|'implemented' }]

function parseAnnotatedPlaywrightTests(content) {
  const lines = content.split('\n');
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\/\/ @unittcms:caseId:(\d+)/);
    if (m) {
      const caseId = parseInt(m[1], 10);
      // A stub has nothing meaningful after the annotation line other than comments and closing braces
      const meaningful = lines.slice(i + 1)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//') && l !== '});' && l !== '}');
      results.push({ caseId, status: meaningful.length === 0 ? 'stub' : 'implemented' });
    }
  }
  return results;
}

function parseAnnotatedPytestTests(content) {
  const MARK_RE = /@pytest\.mark\.unittcms\(case_id=(\d+)/;
  const lines = content.split('\n');
  const results = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(MARK_RE);
    if (m) {
      const caseId = parseInt(m[1], 10);
      // Find the function def that follows this decorator
      const funcIdx = lines.slice(i + 1, i + 4).findIndex((l) => l.trim().startsWith('def '));
      let stub = true;
      if (funcIdx !== -1) {
        const defLine = i + 1 + funcIdx;
        const indent = lines[defLine].length - lines[defLine].trimStart().length;
        for (const line of lines.slice(defLine + 1)) {
          const s = line.trim();
          if (!s || s.startsWith('#')) continue;
          if (line.length - line.trimStart().length <= indent) break;
          if (s !== 'pass') { stub = false; break; }
        }
      }
      results.push({ caseId, status: stub ? 'stub' : 'implemented' });
    }
  }
  return results;
}

// ── Annotators ────────────────────────────────────────────────────────────────

function annotatePlaywrightFile(content, insertions) {
  const lines = content.split('\n');
  for (const { lineIndex, caseId } of [...insertions].sort((a, b) => b.lineIndex - a.lineIndex)) {
    const testLine = lines[lineIndex];
    const innerIndent = (testLine.length - testLine.trimStart().length) + 2;
    lines.splice(lineIndex + 1, 0, ' '.repeat(innerIndent) + `// @unittcms:caseId:${caseId}`);
  }
  return lines.join('\n');
}

function annotatePytestFile(content, insertions) {
  const lines = content.split('\n');
  for (const { lineIndex, caseId } of [...insertions].sort((a, b) => b.lineIndex - a.lineIndex)) {
    lines.splice(lineIndex, 0, `@pytest.mark.unittcms(case_id=${caseId})`);
  }
  return lines.join('\n');
}

// ── Stub builders ─────────────────────────────────────────────────────────────

function buildPlaywrightStub(title, caseId) {
  const escaped = title.replace(/'/g, "\\'");
  return [
    `  test('${escaped}', async ({ page }) => {`,
    `    // @unittcms:caseId:${caseId}`,
    `    // TODO: implement`,
    `  });`,
    '',
  ].join('\n');
}

function buildPytestStub(title, caseId) {
  const funcName = `test_${slugify(title).replace(/-/g, '_')}`;
  return [
    `@pytest.mark.unittcms(case_id=${caseId})`,
    `def ${funcName}(page):`,
    `    # TODO: implement`,
    `    pass`,
    '',
  ].join('\n');
}

// ── GitHub API ────────────────────────────────────────────────────────────────

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

async function getGitHubRepoInfo(apiBase, token, namespace, repoSlug, tool) {
  const refsData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/ref/heads/main`, token, null);
  const headSha = refsData.object.sha;
  const treeData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/trees/${headSha}?recursive=true`, token, null);
  const extensions = tool === 'pytest' ? ['.py'] : ['.spec.ts', '.spec.js'];
  const testFiles = treeData.tree.filter(
    (item) => item.type === 'blob' && extensions.some((ext) => item.path.endsWith(ext)) && item.path.startsWith('tests/')
  );
  return { headSha, testFiles };
}

async function getGitHubFileContent(apiBase, token, namespace, repoSlug, path) {
  const data = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/contents/${encodeURIComponent(path)}`, token, null);
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

async function commitGitHubFiles(apiBase, token, namespace, repoSlug, fileChanges, message) {
  const refsData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/ref/heads/main`, token, null);
  const currentSha = refsData.object.sha;
  const commitData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/commits/${currentSha}`, token, null);

  const treeEntries = await Promise.all(
    fileChanges.map(async ({ path, content }) => {
      const blob = await ghRequest('POST', `${apiBase}/repos/${namespace}/${repoSlug}/git/blobs`, token, {
        content,
        encoding: 'utf-8',
      });
      return { path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  const newTree = await ghRequest('POST', `${apiBase}/repos/${namespace}/${repoSlug}/git/trees`, token, {
    base_tree: commitData.tree.sha,
    tree: treeEntries,
  });

  const newCommit = await ghRequest('POST', `${apiBase}/repos/${namespace}/${repoSlug}/git/commits`, token, {
    message,
    tree: newTree.sha,
    parents: [currentSha],
  });

  await ghRequest('PATCH', `${apiBase}/repos/${namespace}/${repoSlug}/git/refs/heads/main`, token, {
    sha: newCommit.sha,
  });

  return { sha: newCommit.sha };
}

// ── GitLab API ────────────────────────────────────────────────────────────────

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

async function getGitLabRepoInfo(apiBase, token, repoId, tool) {
  const branchData = await glRequest('GET', `${apiBase}/projects/${repoId}/repository/branches/main`, token, null);
  const headSha = branchData.commit.id;
  const fullTree = await glRequest('GET', `${apiBase}/projects/${repoId}/repository/tree?recursive=true&per_page=100`, token, null);
  const existingPaths = new Set(fullTree.filter((i) => i.type === 'blob').map((i) => i.path));
  const extensions = tool === 'pytest' ? ['.py'] : ['.spec.ts', '.spec.js'];
  const testFiles = fullTree.filter(
    (item) => item.type === 'blob' && extensions.some((ext) => item.path.endsWith(ext)) && item.path.startsWith('tests/')
  );
  return { headSha, testFiles, existingPaths };
}

async function getGitLabFileContent(apiBase, token, repoId, path) {
  const res = await fetch(`${apiBase}/projects/${repoId}/repository/files/${encodeURIComponent(path)}/raw?ref=main`, {
    headers: { 'PRIVATE-TOKEN': token },
  });
  if (!res.ok) throw new Error(`GitLab file ${res.status}`);
  return res.text();
}

async function commitGitLabFiles(apiBase, token, repoId, fileChanges, existingPaths, message) {
  const actions = fileChanges.map(({ path, content }) => ({
    action: existingPaths.has(path) ? 'update' : 'create',
    file_path: path,
    content,
  }));
  const commit = await glRequest('POST', `${apiBase}/projects/${repoId}/repository/commits`, token, {
    branch: 'main',
    commit_message: message,
    actions,
  });
  return { sha: commit.id };
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function findOrCreateFolder(db, projectId, name, parentFolderId, folderById, folderByName) {
  const key = `${parentFolderId ?? null}:${name.toLowerCase()}`;
  if (folderByName[key]) return folderByName[key];
  const created = await db.repos.folders.create({ name, projectId, parentFolderId: parentFolderId ?? null, detail: '' });
  const folder = created.toJSON();
  folderById[folder.id] = folder;
  folderByName[key] = folder;
  return folder;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/:id/sync', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');
      if (!config.repoUrl) return res.status(422).send('No repo connected');

      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        return res.status(err.statusCode || 422).send(err.message);
      }

      const { token, instanceUrl, namespace: credNamespace } = credentials;
      const { projectId, automationTool, automationLanguage, provider, repoId } = config;

      const isGitHub = provider === 'github';
      const apiBase = isGitHub
        ? (instanceUrl.includes('github.com') ? 'https://api.github.com' : `${instanceUrl}/api/v3`)
        : `${instanceUrl}/api/v4`;

      let namespace = credNamespace;
      let repoSlug;
      if (isGitHub) {
        if (!namespace) {
          const user = await ghRequest('GET', `${apiBase}/user`, token, null);
          namespace = user.login;
        }
        repoSlug = config.repoUrl.split('/').pop();
      }

      // ── 1. Fetch repo tree ────────────────────────────────────────────────
      let headSha, testFiles, existingPaths;
      if (isGitHub) {
        ({ headSha, testFiles } = await getGitHubRepoInfo(apiBase, token, namespace, repoSlug, automationTool));
      } else {
        ({ headSha, testFiles, existingPaths } = await getGitLabRepoInfo(apiBase, token, repoId, automationTool));
      }

      // ── 2. Load project folders and cases ────────────────────────────────
      const folders = await db.repos.folders.findAll({ where: { projectId }, raw: true });
      const folderById = {};
      const folderByName = {};
      for (const f of folders) {
        folderById[f.id] = f;
        folderByName[`${f.parentFolderId ?? null}:${f.name.toLowerCase()}`] = f;
      }

      const caseObjs = folders.length > 0
        ? await db.repos.cases.findAll({
            where: { folderId: folders.map((f) => f.id) },
            include: [{ model: db.repos.tags, as: 'Tags', through: { attributes: [] } }],
          })
        : [];
      const cases = caseObjs.map((c) => c.toJSON());

      // ── 3. Ensure "automated" tag exists ─────────────────────────────────
      const [automatedTag] = await db.repos.tags.findOrCreate({
        where: { name: 'automated', projectId },
        defaults: { name: 'automated', projectId },
      });

      // ── 4. Process each test file ─────────────────────────────────────────
      // Collects: file modifications, new cases to create, status updates for existing cases
      const fileModifications = {};
      const annotatedStatusMap = {}; // caseId → { status, filePath }
      let addedToTestPlan = 0;

      for (const file of testFiles) {
        let content;
        try {
          content = isGitHub
            ? await getGitHubFileContent(apiBase, token, namespace, repoSlug, file.path)
            : await getGitLabFileContent(apiBase, token, repoId, file.path);
        } catch (_) {
          continue;
        }

        // Parse existing annotated tests → record their stub/implemented status
        const annotated = automationTool === 'pytest'
          ? parseAnnotatedPytestTests(content)
          : parseAnnotatedPlaywrightTests(content);
        for (const { caseId, status } of annotated) {
          annotatedStatusMap[caseId] = { status, filePath: file.path };
        }

        // Parse new unannotated tests → create cases + annotate file
        const newTests = automationTool === 'pytest'
          ? parseNewPytestTests(content)
          : parseNewPlaywrightTests(content);

        if (newTests.length === 0) continue;

        const rootFolderName = humanizeFileName(file.path, automationTool);
        const rootFolder = await findOrCreateFolder(db, projectId, rootFolderName, null, folderById, folderByName);

        const insertions = [];
        for (const test of newTests) {
          let parentFolderId = rootFolder.id;
          for (const describeName of test.describePath) {
            const sub = await findOrCreateFolder(db, projectId, describeName, parentFolderId, folderById, folderByName);
            parentFolderId = sub.id;
          }

          const title = humanizeTitle(test.title);
          const alreadyExists = cases.some(
            (c) => c.folderId === parentFolderId && c.title.toLowerCase() === title.toLowerCase()
          );
          if (alreadyExists) continue;

          const created = await db.repos.cases.create({
            title,
            folderId: parentFolderId,
            state: 1,
            priority: 2,
            type: 0,
            automationStatus: 0,
            template: 0,
            codeStatus: 'stub',
            codeFilePath: file.path,
            codeLastSyncAt: new Date(),
            codeCommitSha: headSha,
          });

          cases.push({ id: created.id, folderId: parentFolderId, title, Tags: [], codeStatus: 'stub' });
          insertions.push({ lineIndex: test.lineIndex, caseId: created.id });
          addedToTestPlan++;
        }

        if (insertions.length > 0) {
          fileModifications[file.path] = automationTool === 'pytest'
            ? annotatePytestFile(content, insertions)
            : annotatePlaywrightFile(content, insertions);
        }
      }

      // ── 5. Update codeStatus for all annotated tests ──────────────────────
      // This is what makes the "AUTOMATED" badge and implemented panel work
      // without requiring CI to be configured.
      let updatedStatus = 0;
      const now = new Date();
      if (Object.keys(annotatedStatusMap).length > 0) {
        await Promise.all(
          Object.entries(annotatedStatusMap).map(async ([caseIdStr, { status, filePath }]) => {
            const caseId = parseInt(caseIdStr, 10);
            const result = await db.repos.cases.update(
              { codeStatus: status, codeFilePath: filePath, codeLastSyncAt: now, codeCommitSha: headSha },
              { where: { id: caseId } }
            );
            if (result[0] > 0) {
              updatedStatus++;
              // Update in-memory cache too so auto-tag step below is accurate
              const c = cases.find((x) => x.id === caseId);
              if (c) c.codeStatus = status;
            }
          })
        );
      }

      // ── 6. Plan → Code: add stubs for cases without automation code ───────
      let addedToCode = 0;
      const casesWithoutCode = cases.filter((c) => !c.codeStatus || c.codeStatus === 'stale' || c.codeStatus === 'none');

      if (casesWithoutCode.length > 0) {
        const byRootFolder = {};
        for (const c of casesWithoutCode) {
          let current = folderById[c.folderId];
          if (!current) continue;
          while (current.parentFolderId && folderById[current.parentFolderId]) {
            current = folderById[current.parentFolderId];
          }
          if (!byRootFolder[current.name]) byRootFolder[current.name] = [];
          byRootFolder[current.name].push(c);
        }

        for (const [rootName, folderCases] of Object.entries(byRootFolder)) {
          let filePath;
          if (automationTool === 'pytest') {
            filePath = `tests/test_${slugify(rootName).replace(/-/g, '_')}.py`;
          } else {
            const langExt = automationLanguage === 'typescript' ? 'ts' : 'js';
            filePath = `tests/${slugify(rootName)}.spec.${langExt}`;
          }

          let fileContent = fileModifications[filePath] ?? null;
          if (!fileContent) {
            try {
              fileContent = isGitHub
                ? await getGitHubFileContent(apiBase, token, namespace, repoSlug, filePath)
                : await getGitLabFileContent(apiBase, token, repoId, filePath);
            } catch (_) {
              if (automationTool === 'pytest') {
                fileContent = `import pytest\n\n`;
              } else if (automationLanguage === 'typescript') {
                fileContent = `import { test } from '@playwright/test';\n\ntest.describe('${rootName.replace(/'/g, "\\'")}', () => {\n});\n`;
              } else {
                fileContent = `const { test } = require('@playwright/test');\n\ntest.describe('${rootName.replace(/'/g, "\\'")}', () => {\n});\n`;
              }
              if (!isGitHub && existingPaths) existingPaths.delete(filePath);
            }
          }

          for (const c of folderCases) {
            const stub = automationTool === 'pytest'
              ? buildPytestStub(c.title, c.id)
              : buildPlaywrightStub(c.title, c.id);

            if (automationTool !== 'pytest') {
              const closeIdx = fileContent.lastIndexOf('});');
              fileContent = closeIdx !== -1
                ? fileContent.slice(0, closeIdx) + stub + fileContent.slice(closeIdx)
                : fileContent + '\n' + stub;
            } else {
              fileContent += '\n' + stub;
            }
            addedToCode++;
          }

          fileModifications[filePath] = fileContent;
        }
      }

      // ── 7. Commit all file changes ────────────────────────────────────────
      let commitUrl = null;
      if (Object.keys(fileModifications).length > 0) {
        const fileChanges = Object.entries(fileModifications).map(([path, content]) => ({ path, content }));
        const commitMsg = 'chore: sync test annotations with UnitTCMS';

        let result;
        if (isGitHub) {
          result = await commitGitHubFiles(apiBase, token, namespace, repoSlug, fileChanges, commitMsg);
          commitUrl = `${config.repoUrl}/commit/${result.sha}`;
        } else {
          result = await commitGitLabFiles(apiBase, token, repoId, fileChanges, existingPaths || new Set(), commitMsg);
          commitUrl = `${config.repoUrl}/-/commit/${result.sha}`;
        }
      }

      // ── 8. Apply "automated" tag to all implemented cases ─────────────────
      let taggedAutomated = 0;
      const implementedCases = cases.filter((c) => c.codeStatus === 'implemented');
      for (const c of implementedCases) {
        const hasTag = (c.Tags || []).some((t) => t.id === automatedTag.id);
        if (!hasTag) {
          try {
            await db.repos.caseTags.create({ caseId: c.id, tagId: automatedTag.id });
            taggedAutomated++;
          } catch (_) {
            // Ignore duplicate tag errors (unique constraint)
          }
        }
      }

      res.json({ addedToTestPlan, addedToCode, updatedStatus, taggedAutomated, commitUrl });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
