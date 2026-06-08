import express from 'express';
const router = express.Router();
import Anthropic from '@anthropic-ai/sdk';
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from './_credentials.js';
import { slugify } from './_builders.js';

// ── Git helpers (GitHub only for now, same pattern as syncTests.js) ──────────

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

async function getTestRepoTree(isGitHub, apiBase, token, namespace, repoSlug, repoId, tool) {
  const extensions = tool === 'pytest' ? ['.py'] : ['.spec.ts', '.spec.js'];
  if (isGitHub) {
    const refsData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/ref/heads/main`, token, null);
    const headSha = refsData.object.sha;
    const treeData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/trees/${headSha}?recursive=true`, token, null);
    return treeData.tree.filter(
      (item) => item.type === 'blob' && extensions.some((ext) => item.path.endsWith(ext)) && item.path.startsWith('tests/')
    );
  } else {
    const fullTree = await glRequest('GET', `${apiBase}/projects/${repoId}/repository/tree?recursive=true&per_page=100`, token, null);
    return fullTree.filter(
      (item) => item.type === 'blob' && extensions.some((ext) => item.path.endsWith(ext)) && item.path.startsWith('tests/')
    );
  }
}

async function getFileContent(isGitHub, apiBase, token, namespace, repoSlug, repoId, filePath) {
  if (isGitHub) {
    const data = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/contents/${encodeURIComponent(filePath)}`, token, null);
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } else {
    const res = await fetch(`${apiBase}/projects/${repoId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=main`, {
      headers: { 'PRIVATE-TOKEN': token },
    });
    if (!res.ok) throw new Error(`GitLab file ${res.status}`);
    return res.text();
  }
}

async function commitFiles(isGitHub, apiBase, token, namespace, repoSlug, repoId, fileChanges, message) {
  if (isGitHub) {
    const refsData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/ref/heads/main`, token, null);
    const currentSha = refsData.object.sha;
    const commitData = await ghRequest('GET', `${apiBase}/repos/${namespace}/${repoSlug}/git/commits/${currentSha}`, token, null);

    const treeEntries = await Promise.all(
      fileChanges.map(async ({ path, content }) => {
        const blob = await ghRequest('POST', `${apiBase}/repos/${namespace}/${repoSlug}/git/blobs`, token, { content, encoding: 'utf-8' });
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

    await ghRequest('PATCH', `${apiBase}/repos/${namespace}/${repoSlug}/git/refs/heads/main`, token, { sha: newCommit.sha });
    return newCommit.sha;
  } else {
    // For GitLab, first get existing paths to decide create vs update
    const fullTree = await glRequest('GET', `${apiBase}/projects/${repoId}/repository/tree?recursive=true&per_page=100`, token, null);
    const existingPaths = new Set(fullTree.filter((i) => i.type === 'blob').map((i) => i.path));

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
    return commit.id;
  }
}

// ── AI prompt helpers ─────────────────────────────────────────────────────────

function buildHierarchyText(folders, cases) {
  const folderById = {};
  for (const f of folders) folderById[f.id] = f;

  function getPath(folderId) {
    const parts = [];
    let current = folderById[folderId];
    while (current) {
      parts.unshift(current.name);
      current = folderById[current.parentFolderId];
    }
    return parts.join(' > ');
  }

  return cases.map((c) => `- [${getPath(c.folderId)}] ${c.title}`).join('\n');
}

function parseAiResponse(text) {
  const caseNames = [];
  const fileBlocks = [];

  // Extract test case names (lines starting with "- " under "TEST CASES:")
  const caseSection = text.match(/TEST CASES:\s*([\s\S]*?)(?=TEST CODE:|$)/i);
  if (caseSection) {
    const lines = caseSection[1].split('\n');
    for (const line of lines) {
      const m = line.match(/^[-*]\s+(.+)/);
      if (m) caseNames.push(m[1].trim());
    }
  }

  // Extract code blocks with filepath labels
  // Format: ```filepath: tests/foo.spec.ts ... ``` or ``` tests/foo.spec.ts ... ```
  const codeBlockRe = /```(?:filepath:\s*)?([^\s`]+\.(?:spec\.ts|spec\.js|py))\n([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRe.exec(text)) !== null) {
    fileBlocks.push({ path: match[1].trim(), content: match[2] });
  }

  // Fallback: any fenced code block labeled typescript/python that has a @unittcms pattern
  if (fileBlocks.length === 0) {
    const fallbackRe = /```(?:typescript|javascript|python)\n([\s\S]*?)```/g;
    let i = 0;
    while ((match = fallbackRe.exec(text)) !== null) {
      fileBlocks.push({ path: `tests/generated_${i++}.spec.ts`, content: match[1] });
    }
  }

  return { caseNames, fileBlocks };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/:id/analyze-commit/:sha', verifySignedIn, async (req, res) => {
    const configId = req.params.id;
    const sha = req.params.sha;

    try {
      const config = await db.repos.automationConfigs.findByPk(configId);
      if (!config) return res.status(404).send('Config not found');
      if (!config.repoUrl) return res.status(422).send('No test repository connected');

      const sourceCommit = await db.repos.sourceCommits.findOne({
        where: { automationConfigId: configId, sha },
      });
      if (!sourceCommit) return res.status(404).send('Source commit not found — sync commits first');
      if (!sourceCommit.diff) return res.status(422).send('No diff available for this commit');

      // Mark as analyzing
      await sourceCommit.update({ status: 'analyzing' });

      // Load credentials
      let credentials;
      try {
        credentials = await loadProviderCredentials(db, config);
      } catch (err) {
        await sourceCommit.update({ status: 'failed' });
        return res.status(err.statusCode || 422).send(err.message);
      }

      // Load Anthropic key
      const anthropicIntegration = await db.repos.integrationConfigs.findOne({
        where: { projectId: config.projectId, service: 'anthropic' },
      });
      if (!anthropicIntegration?.apiKey) {
        await sourceCommit.update({ status: 'failed' });
        return res.status(422).send('No Anthropic API key configured. Add it in the Integrations tab.');
      }

      const { token, instanceUrl, namespace: credNamespace } = credentials;
      const isGitHub = config.provider === 'github';
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

      // Load existing test hierarchy from UnitTCMS
      const { projectId, automationTool, automationLanguage, repoId } = config;
      const folders = await db.repos.folders.findAll({ where: { projectId }, raw: true });
      const cases = folders.length > 0
        ? await db.repos.cases.findAll({ where: { folderId: folders.map((f) => f.id) }, raw: true })
        : [];

      // Fetch one sample test file for style reference
      let sampleFileContent = '';
      let sampleFilePath = '';
      try {
        const testFiles = await getTestRepoTree(isGitHub, apiBase, token, namespace, repoSlug, repoId, automationTool);
        if (testFiles.length > 0) {
          sampleFilePath = testFiles[0].path;
          sampleFileContent = await getFileContent(isGitHub, apiBase, token, namespace, repoSlug, repoId, sampleFilePath);
        }
      } catch (_) {
        // No sample file — still proceed
      }

      const hierarchyText = buildHierarchyText(folders, cases);
      const langExt = automationLanguage === 'typescript' ? 'ts' : automationLanguage === 'python' ? 'py' : 'js';
      const fileExt = automationTool === 'pytest' ? '.py' : `.spec.${langExt}`;

      const systemPrompt = `You are a QA automation engineer. You analyze source code changes and generate comprehensive, well-structured automated test cases. You write tests in ${automationTool} using ${automationLanguage}.`;

      const userPrompt = `A developer made the following commit to the source project:

Commit: ${sha.slice(0, 8)} — "${sourceCommit.message}"
Author: ${sourceCommit.author}

<diff>
${sourceCommit.diff.slice(0, 8000)}
</diff>

The test project uses ${automationTool} with ${automationLanguage}.

Existing test hierarchy in UnitTCMS (do not duplicate these):
<test_hierarchy>
${hierarchyText || '(no existing tests)'}
</test_hierarchy>

${sampleFileContent ? `Existing test file for style reference (path: ${sampleFilePath}):\n<sample_file>\n${sampleFileContent.slice(0, 3000)}\n</sample_file>\n` : ''}

Based on the code changes:
1. Identify what new functionality or behavior needs to be tested
2. Write a list of specific test case names
3. Generate the complete test code

Use this exact response format:

TEST CASES:
- [test case name 1]
- [test case name 2]
...

TEST CODE:
\`\`\`filepath: tests/[relevant-name]${fileExt}
[complete test code here, following the style of the sample file]
\`\`\`

Keep tests focused on the changed code. Each test case should be independently meaningful.`;

      const client = new Anthropic({ apiKey: anthropicIntegration.apiKey });
      let aiResponse;
      try {
        aiResponse = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4096,
          messages: [{ role: 'user', content: userPrompt }],
          system: systemPrompt,
        });
      } catch (anthropicErr) {
        await sourceCommit.update({ status: 'failed' });
        let humanMsg = anthropicErr.message || 'Anthropic API error';
        try {
          const parsed = JSON.parse(humanMsg.replace(/^\d{3}\s+/, ''));
          humanMsg = parsed.error?.message || humanMsg;
        } catch (_) {}
        await db.repos.syncLogs.create({
          automationConfigId: config.id,
          type: 'ai_analysis',
          commitSha: sha,
          description: `Anthropic API error: ${humanMsg}`,
          status: 'failed',
          errorMessage: humanMsg,
        }).catch(() => {});
        return res.status(422).send(humanMsg);
      }

      const aiText = aiResponse.content[0]?.type === 'text' ? aiResponse.content[0].text : '';
      const { caseNames, fileBlocks } = parseAiResponse(aiText);

      // Create test cases in UnitTCMS
      const createdCaseIds = [];
      if (caseNames.length > 0) {
        // Find or create a folder named after the commit (under "AI Generated")
        const parentFolder = await db.repos.folders.findOrCreate({
          where: { name: 'AI Generated', projectId, parentFolderId: null },
          defaults: { name: 'AI Generated', projectId, detail: '' },
        });
        const parentFolderId = parentFolder[0].id;

        const shortMsg = sourceCommit.message?.slice(0, 40) || sha.slice(0, 8);
        const commitFolder = await db.repos.folders.findOrCreate({
          where: { name: shortMsg, projectId, parentFolderId },
          defaults: { name: shortMsg, projectId, parentFolderId, detail: sha },
        });
        const commitFolderId = commitFolder[0].id;

        for (const name of caseNames) {
          try {
            const created = await db.repos.cases.create({
              title: name,
              folderId: commitFolderId,
              state: 1,
              priority: 2,
              type: 0,
              automationStatus: 0,
              template: 0,
            });
            createdCaseIds.push(created.id);
          } catch (_) {
            // Skip duplicate case
          }
        }
      }

      // Commit generated test code to the test repo
      let testCommitSha = null;
      if (fileBlocks.length > 0 && config.repoUrl) {
        try {
          const commitMsg = `test: AI-generated tests for commit ${sha.slice(0, 8)} — ${sourceCommit.message?.slice(0, 60)}`;
          testCommitSha = await commitFiles(
            isGitHub, apiBase, token, namespace, repoSlug, repoId,
            fileBlocks, commitMsg
          );
        } catch (err) {
          console.error('Failed to commit test files:', err.message);
        }
      }

      // Update source commit record
      const aiSummary = `Generated ${caseNames.length} test cases, ${fileBlocks.length} test file(s).\n${caseNames.slice(0, 5).join('\n')}`;
      await sourceCommit.update({
        status: 'done',
        aiSummary,
        generatedTestCaseIds: JSON.stringify(createdCaseIds),
        testCommitSha,
      });

      // Log the activity
      await db.repos.syncLogs.create({
        automationConfigId: config.id,
        type: 'ai_analysis',
        commitSha: sha,
        description: aiSummary,
        created: createdCaseIds.length,
        status: 'success',
      });

      res.json({
        sha,
        caseNames,
        createdCaseIds,
        filesGenerated: fileBlocks.map((f) => f.path),
        testCommitSha,
        aiSummary,
      });
    } catch (error) {
      console.error(error);
      // Mark commit as failed if we have it
      try {
        const sc = await db.repos.sourceCommits.findOne({ where: { automationConfigId: configId, sha } });
        if (sc && sc.status === 'analyzing') await sc.update({ status: 'failed' });
        await db.repos.syncLogs.create({
          automationConfigId: configId,
          type: 'ai_analysis',
          commitSha: sha,
          description: error.message,
          status: 'failed',
          errorMessage: error.message,
        });
      } catch (_) {}
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
