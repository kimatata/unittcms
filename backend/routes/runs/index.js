import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRun from '../../models/runs';

export default function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromProjectId } = require('../../middleware/verifyVisible')(sequelize);
  const Run = defineRun(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const runs = await Run.findAll({
        where: {
          projectId: projectId,
        },
      });
      res.json(runs);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
