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
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const projectId = req.query.projectId;
    const { provider, repoOwner, repoName, accessToken } = req.body;

    if (!provider || !repoOwner || !repoName) {
      return res.status(400).json({ error: 'provider, repoOwner, and repoName are required' });
    }

    let encryptedToken = null;
    if (accessToken) {
      try {
        encryptedToken = encrypt(accessToken);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server configuration error: SECRET_KEY is required for token storage' });
      }
    }

    try {
      const config = await CiRepositoryConfig.create({
        projectId,
        provider,
        repoOwner,
        repoName,
        accessToken: encryptedToken,
        enabled: true,
      });
      res.status(201).json(toSafeConfig(config));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
