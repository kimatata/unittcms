import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { inferApiBase, fetchBranches, fetchOpenPRs, inferTicketId } from './_gitHelpers.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /sprint/detect?automationConfigId=X
  // Scans the SOURCE repo for new feature branches branched off the configured source branch.
  router.get('/detect', verifySignedIn, async (req, res) => {
    try {
      const { automationConfigId } = req.query;
      if (!automationConfigId) return res.status(400).send('automationConfigId required');

      const config = await db.repos.automationConfigs.findByPk(automationConfigId);
      if (!config) return res.status(404).send('Config not found');

      // Require source repo to be configured
      if (!config.sourceRepoOwner || !config.sourceRepoName) {
        return res.status(422).send('No source repository configured. Go to the Integrations tab to connect a source project.');
      }

      const sourceProvider = config.sourceProvider || config.provider;

      // Load credentials for the source provider
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
      // GitLab: encode namespace/repo-name as the project identifier
      const gitLabProjectId = encodeURIComponent(`${namespace}/${repoSlug}`);

      const sprintCfg = await db.repos.sprintConfigs.findOne({ where: { automationConfigId } });
      const ticketRegex = sprintCfg?.branchTicketRegex || '([A-Z]+-[0-9]+)';

      // Key branches = configured patterns + sourceBranch itself
      const baseKeyBranches = sprintCfg
        ? JSON.parse(sprintCfg.keyBranchPatterns || '[]')
        : ['main', 'master', 'develop'];
      const sourceBranch = sprintCfg?.sourceBranch || null;
      const keyBranches = sourceBranch && !baseKeyBranches.includes(sourceBranch)
        ? [...baseKeyBranches, sourceBranch]
        : baseKeyBranches;

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

      const isKeyBranch = (name) => keyBranches.some((k) => {
        if (k.includes('*')) {
          const pattern = new RegExp('^' + k.replace('*', '.*') + '$');
          return pattern.test(name);
        }
        return name === k;
      });

      const featureBranches = allBranches.filter((b) => !isKeyBranch(b.name));

      // Compare against branches already tracked in active/draft/testing sprint flows
      const activeFlows = await db.repos.sprintFlows.findAll({
        where: { automationConfigId, status: ['active', 'draft', 'testing'] },
      });
      const knownBranches = new Set();
      for (const flow of activeFlows) {
        try {
          const snapshot = JSON.parse(flow.branchSnapshot || '[]');
          snapshot.forEach((b) => knownBranches.add(b.name));
        } catch (_) {}
      }

      const newBranches = featureBranches.filter((b) => !knownBranches.has(b.name));

      const enrichedBranches = featureBranches.map((b) => {
        const pr = openPRs.find((p) => p.sourceBranch === b.name);
        return {
          ...b,
          ticketId: inferTicketId(b.name, ticketRegex),
          prNumber: pr?.number || null,
          prTitle: pr?.title || null,
          prTargetBranch: pr?.targetBranch || null,
          prState: pr?.state || null,
          prUrl: pr?.url || null,
        };
      });

      // Detect the version branch (most common PR target among feature branches)
      const targetCounts = {};
      openPRs.forEach((pr) => {
        if (!isKeyBranch(pr.sourceBranch)) {
          targetCounts[pr.targetBranch] = (targetCounts[pr.targetBranch] || 0) + 1;
        }
      });
      const detectedVersionBranch = Object.entries(targetCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      res.json({
        featureBranches: enrichedBranches,
        newBranchCount: newBranches.length,
        newBranches: newBranches.map((b) => b.name),
        detectedVersionBranch,
        hasNewBranches: newBranches.length > 0,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
