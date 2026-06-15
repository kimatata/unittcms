import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import { inferApiBase, fetchBranches, fetchOpenPRs } from './_gitHelpers.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /sprint/flows?automationConfigId=X — list sprint flows for a config
  router.get('/flows', verifySignedIn, async (req, res) => {
    try {
      const { automationConfigId } = req.query;
      if (!automationConfigId) return res.status(400).send('automationConfigId required');

      const flows = await db.repos.sprintFlows.findAll({
        where: { automationConfigId },
        order: [['createdAt', 'DESC']],
        limit: 20,
      });

      res.json(flows.map((f) => ({
        ...f.toJSON(),
        branchSnapshot: f.branchSnapshot ? JSON.parse(f.branchSnapshot) : [],
        nodePositions: f.nodePositions ? JSON.parse(f.nodePositions) : {},
        generationLogs: f.generationLogs ? JSON.parse(f.generationLogs) : [],
        testPlanDraft: f.testPlanDraft ? JSON.parse(f.testPlanDraft) : null,
      })));
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // GET /sprint/flows/:flowId — load one sprint flow with live branch/PR overlay
  router.get('/flows/:flowId', verifySignedIn, async (req, res) => {
    try {
      const flow = await db.repos.sprintFlows.findByPk(req.params.flowId);
      if (!flow) return res.status(404).send('Sprint flow not found');

      const config = await db.repos.automationConfigs.findByPk(flow.automationConfigId);
      if (!config) return res.status(404).send('Config not found');

      let liveBranches = [];
      let livePRs = [];

      if (config.sourceRepoOwner && config.sourceRepoName) {
        try {
          const sourceProvider = config.sourceProvider || config.provider;
          const integration = await db.repos.integrationConfigs.findOne({
            where: { projectId: config.projectId, service: sourceProvider },
          });
          if (integration) {
            const token = integration.apiKey;
            const instanceUrl = integration.settings?.instanceUrl ||
              (sourceProvider === 'github' ? 'https://github.com' : 'https://gitlab.com');
            const apiBase = inferApiBase(sourceProvider, instanceUrl);
            const namespace = config.sourceRepoOwner;
            const repoSlug = config.sourceRepoName;
            const gitLabProjectId = encodeURIComponent(`${namespace}/${repoSlug}`);

            [liveBranches, livePRs] = await Promise.all([
              fetchBranches(sourceProvider, apiBase, token, namespace, repoSlug,
                sourceProvider === 'github' ? null : gitLabProjectId),
              fetchOpenPRs(sourceProvider, apiBase, token, namespace, repoSlug,
                sourceProvider === 'github' ? null : gitLabProjectId),
            ]);
          }
        } catch (_) {
          // Live fetch failed — return snapshot only
        }
      }

      const snapshot = flow.branchSnapshot ? JSON.parse(flow.branchSnapshot) : [];

      // Overlay live PR/CI state onto snapshot
      const enriched = snapshot.map((branch) => {
        const livePR = livePRs.find((p) => p.sourceBranch === branch.name);
        const liveBranch = liveBranches.find((b) => b.name === branch.name);
        return {
          ...branch,
          sha: liveBranch?.sha || branch.sha,
          lastCommitAt: liveBranch?.lastCommitAt || branch.lastCommitAt,
          prState: livePR?.state || branch.prState,
          prTargetBranch: livePR?.targetBranch || branch.prTargetBranch,
          prUrl: livePR?.url || branch.prUrl,
        };
      });

      res.json({
        ...flow.toJSON(),
        branchSnapshot: enriched,
        nodePositions: flow.nodePositions ? JSON.parse(flow.nodePositions) : {},
        generationLogs: flow.generationLogs ? JSON.parse(flow.generationLogs) : [],
        testPlanDraft: flow.testPlanDraft ? JSON.parse(flow.testPlanDraft) : null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // PATCH /sprint/flows/:flowId/positions — save node drag positions
  router.patch('/flows/:flowId/positions', verifySignedIn, async (req, res) => {
    try {
      const flow = await db.repos.sprintFlows.findByPk(req.params.flowId);
      if (!flow) return res.status(404).send('Sprint flow not found');

      await flow.update({ nodePositions: JSON.stringify(req.body.positions || {}) });
      res.json({ ok: true });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
