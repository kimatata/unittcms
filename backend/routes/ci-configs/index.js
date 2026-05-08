import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiRepositoryConfig from '../../models/ciRepositoryConfig.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

function toSafeConfig(config) {
  const data = config.toJSON();
  const hasToken = data.accessToken != null;
  delete data.accessToken;
  return { ...data, hasToken };
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);
  const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const configs = await CiRepositoryConfig.findAll({ where: { projectId } });
      res.json(configs.map(toSafeConfig));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
