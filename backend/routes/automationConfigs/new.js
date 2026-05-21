import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  router.post('/', verifySignedIn, async (req, res) => {
    try {
      const { projectId, gitlabUrl, gitlabToken, gitlabNamespace, repoName, automationTool, automationLanguage, provider } =
        req.body;

      const existing = await AutomationConfig.findOne({ where: { projectId } });
      if (existing) {
        return res.status(409).send('Config already exists for this project');
      }

      const config = await AutomationConfig.create({
        projectId,
        gitlabUrl,
        gitlabToken,
        gitlabNamespace,
        repoName,
        automationTool,
        automationLanguage,
        provider: provider || 'gitlab',
      });

      const data = config.toJSON();
      data.gitlabToken = '***';
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
