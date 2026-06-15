import express from 'express';
const router = express.Router();
import Anthropic from '@anthropic-ai/sdk';
import authMiddleware from '../../middleware/auth.js';
import { loadProviderCredentials } from '../automationConfigs/_credentials.js';
import { ghRequest, glRequest, inferApiBase } from './_gitHelpers.js';

// ── Helpers (mirrored from analyzeCommit.js) ─────────────────────────────────

function buildHierarchyText(folders, cases) {
  const folderById = {};
  for (const f of folders) folderById[f.id] = f;
  function getPath(folderId) {
    const parts = [];
    let current = folderById[folderId];
    while (current) { parts.unshift(current.name); current = folderById[current.parentFolderId]; }
    return parts.join(' > ');
  }
  return cases.map((c) => `- [${getPath(c.folderId)}] ${c.title}`).join('\n');
}

function parseAiResponse(text) {
  const folders = [];
  let currentFolder = null;

  // Format expected:
  // ## Folder Name
  // - Case title
  //   Steps: step 1 | step 2
  //   Expected: expected result

  const lines = text.split('\n');
  for (const line of lines) {
    const folderMatch = line.match(/^##\s+(.+)/);
    if (folderMatch) {
      if (currentFolder) folders.push(currentFolder);
      currentFolder = { name: folderMatch[1].trim(), cases: [] };
      continue;
    }
    const caseMatch = line.match(/^[-*]\s+(.+)/);
    if (caseMatch && currentFolder) {
      currentFolder.cases.push({ title: caseMatch[1].trim(), steps: [], expectedResult: '' });
    }
    const stepsMatch = line.match(/^\s+Steps?:\s+(.+)/i);
    if (stepsMatch && currentFolder?.cases.length) {
      const lastCase = currentFolder.cases[currentFolder.cases.length - 1];
      lastCase.steps = stepsMatch[1].split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean);
    }
    const expectedMatch = line.match(/^\s+Expected?:\s+(.+)/i);
    if (expectedMatch && currentFolder?.cases.length) {
      const lastCase = currentFolder.cases[currentFolder.cases.length - 1];
      lastCase.expectedResult = expectedMatch[1].trim();
    }
  }
  if (currentFolder) folders.push(currentFolder);

  // Fallback: if no ## headers found, treat each bullet as a case in a default folder
  if (folders.length === 0) {
    const cases = [];
    for (const line of lines) {
      const m = line.match(/^[-*]\s+(.+)/);
      if (m) cases.push({ title: m[1].trim(), steps: [], expectedResult: '' });
    }
    if (cases.length > 0) folders.push({ name: 'Generated Tests', cases });
  }

  return folders;
}

// SSE helper: sends one JSON event on the response
function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Routes ────────────────────────────────────────────────────────────────────

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /sprint/flows/:flowId/generate/prepare
  // Returns branch diffs + existing cases + default prompt (no streaming)
  router.get('/flows/:flowId/generate/prepare', verifySignedIn, async (req, res) => {
    try {
      const flow = await db.repos.sprintFlows.findByPk(req.params.flowId);
      if (!flow) return res.status(404).send('Sprint flow not found');

      const config = await db.repos.automationConfigs.findByPk(flow.automationConfigId);
      if (!config) return res.status(404).send('Config not found');

      const snapshot = flow.branchSnapshot ? JSON.parse(flow.branchSnapshot) : [];
      const { projectId, automationTool, automationLanguage } = config;

      const folders = await db.repos.folders.findAll({ where: { projectId }, raw: true });
      const cases = folders.length > 0
        ? await db.repos.cases.findAll({ where: { folderId: folders.map((f) => f.id) }, raw: true })
        : [];

      const hierarchyText = buildHierarchyText(folders, cases);

      // Collect stored diffs for branches in this sprint
      const branchNames = snapshot.map((b) => b.name);
      const storedCommits = await db.repos.sourceCommits.findAll({
        where: { automationConfigId: flow.automationConfigId },
        order: [['committedAt', 'DESC']],
        limit: 50,
        raw: true,
      });

      const diffText = storedCommits
        .filter((c) => c.diff)
        .slice(0, 10)
        .map((c) => `=== Commit: ${c.sha.slice(0, 8)} — ${(c.message || '').slice(0, 80)} ===\n${(c.diff || '').slice(0, 2000)}`)
        .join('\n\n');

      const langExt = automationLanguage === 'typescript' ? 'TypeScript' : automationLanguage === 'python' ? 'Python' : 'JavaScript';

      const defaultPrompt = `You are a senior QA engineer. Analyze the following code changes from a sprint and generate a comprehensive test plan.

The test project uses ${automationTool} with ${langExt}.

SPRINT BRANCHES:
${branchNames.join('\n')}

CODE CHANGES (diffs):
<diffs>
${diffText || '(no diffs stored — branches listed above)'}
</diffs>

EXISTING TEST HIERARCHY (do not duplicate):
<existing_tests>
${hierarchyText || '(no existing tests)'}
</existing_tests>

Generate a structured test plan as a hierarchy of folders and test cases. For each new feature or change, create a folder with relevant test cases.

Use this EXACT format:
## Folder Name
- Test case title
  Steps: step 1 | step 2 | step 3
  Expected: expected result

## Another Folder
- Another test case
  Steps: navigate to page | click button
  Expected: confirmation message shown

Cover: happy paths, edge cases, error states. Be specific and actionable.`;

      res.json({
        branchNames,
        existingCaseCount: cases.length,
        diffCount: storedCommits.filter((c) => c.diff).length,
        defaultPrompt,
        savedPrompt: flow.generationPrompt || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // POST /sprint/flows/:flowId/generate/run  — SSE streaming generation
  router.post('/flows/:flowId/generate/run', verifySignedIn, async (req, res) => {
    const flow = await db.repos.sprintFlows.findByPk(req.params.flowId).catch(() => null);
    if (!flow) return res.status(404).send('Sprint flow not found');

    const config = await db.repos.automationConfigs.findByPk(flow.automationConfigId).catch(() => null);
    if (!config) return res.status(404).send('Config not found');

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const logs = [];
    const addLog = (task, status, output = '', durationMs = 0) => {
      const entry = { task, status, output, durationMs, ts: Date.now() };
      logs.push(entry);
      sendEvent(res, 'task', entry);
    };

    try {
      const prompt = req.body.prompt;
      if (prompt) {
        await flow.update({ generationPrompt: prompt });
      }
      const finalPrompt = prompt || flow.generationPrompt;
      if (!finalPrompt) {
        sendEvent(res, 'error', { message: 'No prompt provided' });
        return res.end();
      }

      const snapshot = flow.branchSnapshot ? JSON.parse(flow.branchSnapshot) : [];
      const { projectId } = config;

      // Task 1: Load existing cases
      let t = Date.now();
      addLog('Load existing test cases', 'running');
      const folders = await db.repos.folders.findAll({ where: { projectId }, raw: true });
      const cases = folders.length > 0
        ? await db.repos.cases.findAll({ where: { folderId: folders.map((f) => f.id) }, raw: true })
        : [];
      addLog('Load existing test cases', 'done', `${cases.length} cases in ${folders.length} folders`, Date.now() - t);

      // Task 2: Collect diffs
      t = Date.now();
      addLog('Collect branch diffs', 'running');
      const storedCommits = await db.repos.sourceCommits.findAll({
        where: { automationConfigId: flow.automationConfigId },
        order: [['committedAt', 'DESC']],
        limit: 30,
        raw: true,
      });
      const diffsWithContent = storedCommits.filter((c) => c.diff);
      addLog('Collect branch diffs', 'done', `${diffsWithContent.length} commits with diffs`, Date.now() - t);

      // Task 3: Load Anthropic key
      t = Date.now();
      addLog('Load Anthropic credentials', 'running');
      const anthropicIntegration = await db.repos.integrationConfigs.findOne({
        where: { projectId: config.projectId, service: 'anthropic' },
      });
      if (!anthropicIntegration?.apiKey) {
        addLog('Load Anthropic credentials', 'failed', 'No Anthropic API key configured. Add it in the Integrations tab.');
        sendEvent(res, 'error', { message: 'No Anthropic API key configured' });
        return res.end();
      }
      addLog('Load Anthropic credentials', 'done', 'API key loaded', Date.now() - t);

      // Task 4: Send to Claude
      t = Date.now();
      addLog('Send to Claude', 'running');
      const client = new Anthropic({ apiKey: anthropicIntegration.apiKey });
      let aiText = '';
      try {
        const aiResponse = await client.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 6000,
          messages: [{ role: 'user', content: finalPrompt }],
        });
        aiText = aiResponse.content[0]?.type === 'text' ? aiResponse.content[0].text : '';
        addLog('Send to Claude', 'done', `${aiText.length} chars received`, Date.now() - t);
      } catch (anthropicErr) {
        let humanMsg = anthropicErr.message || 'Anthropic API error';
        addLog('Send to Claude', 'failed', humanMsg);
        sendEvent(res, 'error', { message: humanMsg });
        return res.end();
      }

      // Task 5: Parse test hierarchy
      t = Date.now();
      addLog('Parse test hierarchy', 'running');
      const parsedFolders = parseAiResponse(aiText);
      const totalCases = parsedFolders.reduce((sum, f) => sum + f.cases.length, 0);
      addLog('Parse test hierarchy', 'done', `${parsedFolders.length} folders, ${totalCases} cases`, Date.now() - t);

      // Task 6: Save draft
      t = Date.now();
      addLog('Save draft', 'running');
      await flow.update({
        testPlanDraft: JSON.stringify(parsedFolders),
        generationLogs: JSON.stringify(logs),
        status: 'draft',
      });
      addLog('Save draft', 'done', `Draft saved with ${totalCases} test cases`, Date.now() - t);

      sendEvent(res, 'complete', {
        folders: parsedFolders,
        totalCases,
      });
      res.end();
    } catch (error) {
      console.error(error);
      addLog('Generation failed', 'failed', error.message);
      sendEvent(res, 'error', { message: error.message || 'Internal Server Error' });
      res.end();
    }
  });

  // PATCH /sprint/flows/:flowId/draft — save edited draft without approving
  router.patch('/flows/:flowId/draft', verifySignedIn, async (req, res) => {
    try {
      const flow = await db.repos.sprintFlows.findByPk(req.params.flowId);
      if (!flow) return res.status(404).send('Sprint flow not found');

      await flow.update({
        testPlanDraft: JSON.stringify(req.body.draft),
        status: flow.status === 'active' ? 'draft' : flow.status,
      });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // POST /sprint/flows/:flowId/approve — bulk-create approved test cases into the test run
  router.post('/flows/:flowId/approve', verifySignedIn, async (req, res) => {
    try {
      const flow = await db.repos.sprintFlows.findByPk(req.params.flowId);
      if (!flow) return res.status(404).send('Sprint flow not found');

      const config = await db.repos.automationConfigs.findByPk(flow.automationConfigId);
      if (!config) return res.status(404).send('Config not found');

      const draft = req.body.draft || (flow.testPlanDraft ? JSON.parse(flow.testPlanDraft) : null);
      if (!draft || !Array.isArray(draft)) return res.status(422).send('No draft to approve');

      const { projectId } = config;
      const createdCaseIds = [];

      for (const folder of draft) {
        // Find or create folder
        const [dbFolder] = await db.repos.folders.findOrCreate({
          where: { name: folder.name, projectId, parentFolderId: null },
          defaults: { name: folder.name, projectId, parentFolderId: null, detail: '' },
        });

        for (const testCase of (folder.cases || [])) {
          const created = await db.repos.cases.create({
            title: testCase.title,
            folderId: dbFolder.id,
            state: 1,
            priority: 2,
            type: 0,
            automationStatus: 0,
            template: 0,
          });
          createdCaseIds.push(created.id);

          // Add steps if provided (Step + CaseStep join)
          if (testCase.steps?.length > 0) {
            for (let i = 0; i < testCase.steps.length; i++) {
              const step = await db.repos.steps.create({
                step: testCase.steps[i],
                result: i === testCase.steps.length - 1 ? (testCase.expectedResult || '') : '',
              }).catch(() => null);
              if (step) {
                await db.repos.caseSteps.create({
                  caseId: created.id,
                  stepId: step.id,
                  stepNo: i + 1,
                }).catch(() => {});
              }
            }
          }

          // Add to test run
          if (flow.testRunId) {
            await db.repos.runCases.create({
              runId: flow.testRunId,
              caseId: created.id,
              status: 0,
            }).catch(() => {});
          }
        }
      }

      await flow.update({ status: 'testing' });

      res.json({ createdCaseIds, count: createdCaseIds.length, testRunId: flow.testRunId });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
