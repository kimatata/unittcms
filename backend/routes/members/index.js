import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import defineMember from '../../models/members.js';
import defineProject from '../../models/projects.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';
import { memberRoles } from '../users/authSettings.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);
  const Project = defineProject(sequelize, DataTypes);
  Member.belongsTo(User, { foreignKey: 'userId' });
  Project.belongsTo(User, { foreignKey: 'userId' });

  router.get('/', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId, includeOwner } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const wantOwner = includeOwner === 'true';

      if (!wantOwner) {
        const members = await Member.findAll({
          where: { projectId },
          include: [{ model: User }],
        });
        return res.json(members);
      }

      const [members, project] = await Promise.all([
        Member.findAll({
          where: { projectId },
          include: [{ model: User }],
        }),
        Project.findByPk(projectId, {
          include: [{ model: User }],
        }),
      ]);

      const result = [...members];

      if (project && project.User) {
        const ownerAlreadyMember = members.some((m) => m.userId === project.userId);
        if (!ownerAlreadyMember) {
          const managerRoleIndex = memberRoles.findIndex((r) => r.uid === 'manager');
          result.unshift({
            id: `owner-${project.userId}`,
            userId: project.userId,
            projectId: Number(projectId),
            role: managerRoleIndex,
            User: project.User,
          });
        }
      }

      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
