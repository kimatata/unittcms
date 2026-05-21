import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAutomationConfig from '../../models/automationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const AutomationConfig = defineAutomationConfig(sequelize, DataTypes);

  router.get('/project/:projectId', verifySignedIn, async (req, res) => {
    try {
      const { projectId } = req.params;
      const config = await AutomationConfig.findOne({ where: { projectId } });
      if (!config) {
        return res.status(404).send('Not found');
      }
      // mask token in response
      const data = config.toJSON();
      data.gitlabToken = data.gitlabToken ? '***' : '';
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
