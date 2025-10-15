import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import defineTag from '../../models/tags.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);

  const Tags = defineTag(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const projectId = req.query.projectId;

    if (!projectId) {
      return res.status(400).json({
        error: 'projectId is required',
      });
    }

    try {
      const tags = await Tags.findAll({
        where: {
          projectId: projectId,
        },
        order: [['name', 'ASC']],
      });
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
