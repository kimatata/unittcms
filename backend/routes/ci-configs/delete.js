import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiRepositoryConfig from '../../models/ciRepositoryConfig.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromCiConfigId } = editableMiddleware(sequelize);
  const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);

  router.delete('/:configId', verifySignedIn, verifyProjectManagerFromCiConfigId, async (req, res) => {
    const { configId } = req.params;
    try {
      const config = await CiRepositoryConfig.findByPk(configId);
      if (!config) {
        return res.status(404).send('CI configuration not found');
      }
      await config.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
