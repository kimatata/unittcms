import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  router.put('/:id', verifySignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const { gitlabUrl, gitlabToken, gitlabNamespace, repoName, automationTool, automationLanguage, provider } = req.body;

      const config = await AutomationConfig.findByPk(id);
      if (!config) {
        return res.status(404).send('Not found');
      }

      const updates = { gitlabUrl, gitlabNamespace, repoName, automationTool, automationLanguage, provider };
      // only update token if a real value is provided (not the masked placeholder)
      if (gitlabToken && gitlabToken !== '***') {
        updates.gitlabToken = gitlabToken;
      }

      await config.update(updates);

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
