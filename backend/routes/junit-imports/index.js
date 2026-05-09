import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCiJunitImport from '../../models/ciJunitImport.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);
  const CiJunitImport = defineCiJunitImport(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const imports = await CiJunitImport.findAll({
        where: { projectId },
        order: [['createdAt', 'DESC']],
      });
      res.json(imports);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
