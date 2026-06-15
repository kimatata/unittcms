import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { inferApiBase, fetchBranches, fetchOpenPRs, inferTicketId } from './_gitHelpers.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // POST /sprint/start
  // Creates a new sprint flow by scanning the SOURCE repo for feature branches.
  router.post('/start', verifySignedIn, async (req, res) => {
    try {
      const { automationConfigId, title, baseBranch, versionBranch } = req.body;
      if (!automationConfigId) return res.status(400).send('automationConfigId required');

      const config = await db.repos.automationConfigs.findByPk(automationConfigId);
      if (!config) return res.status(404).send('Config not found');

      if (!config.sourceRepoOwner || !config.sourceRepoName) {
        return res.status(422).send('No source repository configured. Go to the Integrations tab to connect a source project.');
      }

      const sprintCfg = await db.repos.sprintConfigs.findOne({ where: { automationConfigId } });
      const ticketRegex = sprintCfg?.branchTicketRegex || '([A-Z]+-[0-9]+)';

      const sourceProvider = config.sourceProvider || config.provider;

      const integration = await db.repos.integrationConfigs.findOne({
        where: { projectId: config.projectId, service: sourceProvider },
      });
      if (!integration) {
        const name = sourceProvider === 'github' ? 'GitHub' : 'GitLab';
        return res.status(422).send(`No ${name} integration configured. Go to the Integrations tab to add your ${name} token.`);
      }

      const token = integration.apiKey;
      const instanceUrl = integration.settings?.instanceUrl ||
        (sourceProvider === 'github' ? 'https://github.com' : 'https://gitlab.com');
      const apiBase = inferApiBase(sourceProvider, instanceUrl);

      const namespace = config.sourceRepoOwner;
      const repoSlug = config.sourceRepoName;
      const gitLabProjectId = encodeURIComponent(`${namespace}/${repoSlug}`);

      // Key branches = configured patterns + sourceBranch
      const baseKeyBranches = sprintCfg
        ? JSON.parse(sprintCfg.keyBranchPatterns || '[]')
        : ['main', 'master', 'develop'];
      const sourceBranch = sprintCfg?.sourceBranch || baseBranch || 'main';
      const keyBranches = sourceBranch && !baseKeyBranches.includes(sourceBranch)
        ? [...baseKeyBranches, sourceBranch]
        : baseKeyBranches;

      const isKeyBranch = (name) => keyBranches.some((k) => {
        if (k.includes('*')) return new RegExp('^' + k.replace('*', '.*') + '$').test(name);
        return name === k;
      });

      let allBranches = [];
      let openPRs = [];
      try {
        allBranches = await fetchBranches(
          sourceProvider, apiBase, token,
          namespace, repoSlug,
          sourceProvider === 'github' ? null : gitLabProjectId
        );
        openPRs = await fetchOpenPRs(
          sourceProvider, apiBase, token,
          namespace, repoSlug,
          sourceProvider === 'github' ? null : gitLabProjectId
        );
      } catch (err) {
        return res.status(422).send(`Failed to fetch branches from source repository: ${err.message}`);
      }

      const featureBranches = allBranches.filter((b) => !isKeyBranch(b.name));

      const branchSnapshot = featureBranches.map((b) => {
        const pr = openPRs.find((p) => p.sourceBranch === b.name);
        return {
          name: b.name,
          sha: b.sha,
          lastCommitAuthor: b.lastCommitAuthor,
          lastCommitAt: b.lastCommitAt,
          ticketId: inferTicketId(b.name, ticketRegex),
          prNumber: pr?.number || null,
          prTitle: pr?.title || null,
          prTargetBranch: pr?.targetBranch || null,
          prState: pr?.state || null,
          prUrl: pr?.url || null,
        };
      });

      // Create a UnitTCMS test run for this sprint
      const sprintTitle = title || `Sprint — ${new Date().toLocaleDateString()}`;
      const testRun = await db.repos.runs.create({
        name: sprintTitle,
        projectId: config.projectId,
        state: 0,
        description: `Auto-created for sprint flow`,
      });

      const flow = await db.repos.sprintFlows.create({
        automationConfigId,
        title: sprintTitle,
        baseBranch: sourceBranch,
        versionBranch: versionBranch || null,
        testRunId: testRun.id,
        status: 'active',
        branchSnapshot: JSON.stringify(branchSnapshot),
        nodePositions: null,
      });

      res.json({
        flow: {
          ...flow.toJSON(),
          branchSnapshot,
        },
        testRunId: testRun.id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
