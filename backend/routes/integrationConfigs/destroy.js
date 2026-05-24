import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineIntegrationConfig from '../../models/integrationConfigs.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const IntegrationConfig = defineIntegrationConfig(sequelize, DataTypes);

  router.delete('/:id', verifySignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const config = await IntegrationConfig.findByPk(id);
      if (!config) return res.status(404).send('Not found');
      await config.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
