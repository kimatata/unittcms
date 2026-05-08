import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiRepositoryConfig from '../../models/ciRepositoryConfig.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { encrypt } from '../../services/crypto.js';

function toSafeConfig(config) {
  const data = config.toJSON();
  const hasToken = data.accessToken != null;
  delete data.accessToken;
  return { ...data, hasToken };
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromCiConfigId } = editableMiddleware(sequelize);
  const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);

  router.put('/:configId', verifySignedIn, verifyProjectManagerFromCiConfigId, async (req, res) => {
    const { configId } = req.params;
    const { repoOwner, repoName, enabled, accessToken } = req.body;

    try {
      const config = await CiRepositoryConfig.findByPk(configId);
      if (!config) {
        return res.status(404).send('CI configuration not found');
      }

      const updates = {};
      if (repoOwner !== undefined) updates.repoOwner = repoOwner;
      if (repoName !== undefined) updates.repoName = repoName;
      if (enabled !== undefined) updates.enabled = enabled;

      if (accessToken !== undefined) {
        try {
          updates.accessToken = encrypt(accessToken);
        } catch (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server configuration error: SECRET_KEY is required for token storage' });
        }
      }

      await config.update(updates);
      res.json(toSafeConfig(config));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
