import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /sprint/config?automationConfigId=X
  router.get('/config', verifySignedIn, async (req, res) => {
    try {
      const { automationConfigId } = req.query;
      if (!automationConfigId) return res.status(400).send('automationConfigId required');

      const config = await db.repos.sprintConfigs.findOne({ where: { automationConfigId } });
      if (!config) {
        return res.json({
          automationConfigId: Number(automationConfigId),
          keyBranchPatterns: ['main', 'master', 'develop'],
          sprintBranchPattern: null,
          jiraBaseUrl: null,
          jiraProjectKey: null,
          branchTicketRegex: '([A-Z]+-[0-9]+)',
          sourceBranch: null,
          deploymentFlow: null,
        });
      }

      res.json({
        ...config.toJSON(),
        keyBranchPatterns: JSON.parse(config.keyBranchPatterns || '[]'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  // POST /sprint/config
  router.post('/config', verifySignedIn, async (req, res) => {
    try {
      const { automationConfigId, keyBranchPatterns, sprintBranchPattern, jiraBaseUrl, jiraProjectKey, branchTicketRegex, sourceBranch, deploymentFlow } = req.body;
      if (!automationConfigId) return res.status(400).send('automationConfigId required');

      const [config, created] = await db.repos.sprintConfigs.findOrCreate({
        where: { automationConfigId },
        defaults: {
          automationConfigId,
          keyBranchPatterns: JSON.stringify(keyBranchPatterns || ['main', 'master', 'develop']),
          sprintBranchPattern: sprintBranchPattern || null,
          jiraBaseUrl: jiraBaseUrl || null,
          jiraProjectKey: jiraProjectKey || null,
          branchTicketRegex: branchTicketRegex || '([A-Z]+-[0-9]+)',
          sourceBranch: sourceBranch || null,
          deploymentFlow: deploymentFlow || null,
        },
      });

      if (!created) {
        await config.update({
          keyBranchPatterns: JSON.stringify(keyBranchPatterns ?? JSON.parse(config.keyBranchPatterns)),
          sprintBranchPattern: sprintBranchPattern !== undefined ? sprintBranchPattern : config.sprintBranchPattern,
          jiraBaseUrl: jiraBaseUrl !== undefined ? jiraBaseUrl : config.jiraBaseUrl,
          jiraProjectKey: jiraProjectKey !== undefined ? jiraProjectKey : config.jiraProjectKey,
          branchTicketRegex: branchTicketRegex !== undefined ? branchTicketRegex : config.branchTicketRegex,
          sourceBranch: sourceBranch !== undefined ? sourceBranch : config.sourceBranch,
          deploymentFlow: deploymentFlow !== undefined ? deploymentFlow : config.deploymentFlow,
        });
      }

      res.json({
        ...config.toJSON(),
        keyBranchPatterns: JSON.parse(config.keyBranchPatterns || '[]'),
      });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
