import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import defineMember from '../../models/members.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);
  Member.belongsTo(User, { foreignKey: 'userId' });

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const members = await Member.findAll({
        where: {
          projectId: projectId,
        },
        include: [
          {
            model: User,
          },
        ],
      });
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
