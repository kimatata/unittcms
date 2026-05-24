import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import defineIntegrationConfig from '../../models/integrationConfigs.js';
import authMiddleware from '../../middleware/auth.js';
import Anthropic from '@anthropic-ai/sdk';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);
  const IntegrationConfig = defineIntegrationConfig(sequelize, DataTypes);

  router.post('/:id/fix-error', verifySignedIn, async (req, res) => {
    try {
      const config = await AutomationConfig.findByPk(req.params.id);
      if (!config) return res.status(404).send('Not found');
      if (config.provider !== 'github' || !config.repoUrl) {
        return res.status(400).send('Only GitHub repos are supported');
      }

      const { filePath, testName, errorText } = req.body;
      if (!errorText) return res.status(400).send('errorText is required');

      // Get Anthropic key from integrations
      const integration = await IntegrationConfig.findOne({
        where: { projectId: config.projectId, service: 'anthropic' },
      });
      if (!integration) {
        return res.status(422).send('No Anthropic API key configured. Add one in the Integrations tab.');
      }

      const { owner, repo } = parseRepoUrl(config.repoUrl);
      const ghToken = config.gitlabToken;

      // Fetch current file content from GitHub (if a file path was identified)
      let currentContent = null;
      let fileSha = null;
      if (filePath) {
        const fileRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          { headers: githubHeaders(ghToken) }
        );
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          currentContent = Buffer.from(fileData.content, 'base64').toString('utf8');
          fileSha = fileData.sha;
        }
      }

      // Build Claude prompt
      const systemPrompt = buildSystemPrompt(config.automationTool, config.automationLanguage);
      const userMessage = buildUserMessage(testName, errorText, filePath, currentContent);

      // Call Claude API
      const anthropic = new Anthropic({ apiKey: integration.apiKey });
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const fixedContent = extractCode(message.content[0].text);
      if (!fixedContent) {
        return res.status(500).send('AI did not return a valid fix');
      }

      // Commit the fix back to GitHub
      let commitUrl = null;
      if (filePath && fileSha) {
        const commitRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
          {
            method: 'PUT',
            headers: { ...githubHeaders(ghToken), 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `fix: auto-fix failing test — ${testName || filePath}`,
              content: Buffer.from(fixedContent).toString('base64'),
              sha: fileSha,
            }),
          }
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          commitUrl = commitData.commit?.html_url || null;
        }
      }

      res.json({ commitUrl, fixedContent: filePath ? null : fixedContent });
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

function buildSystemPrompt(tool, language) {
  return `You are an expert test automation engineer specializing in ${tool} with ${language}.
Your job is to fix failing automated tests. You will be given:
- The test name and error message from the CI failure
- The current test file content (if available)

Rules:
- Return ONLY the complete fixed file content, inside a single markdown code block
- Do not add explanations before or after the code block
- Preserve all existing tests that are not failing
- Preserve the @unittcms:caseId annotation comments exactly as they are
- Fix the root cause of the test failure, not just suppress the error
- If you cannot determine a reliable fix, make the test skip with a clear comment explaining why`;
}

function buildUserMessage(testName, errorText, filePath, currentContent) {
  let msg = `Fix this failing test.\n\nTest: ${testName || '(unknown)'}\n\nError:\n${errorText}`;
  if (filePath && currentContent) {
    msg += `\n\nCurrent file (${filePath}):\n\`\`\`\n${currentContent}\n\`\`\``;
  }
  return msg;
}

function extractCode(text) {
  const match = text.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}
