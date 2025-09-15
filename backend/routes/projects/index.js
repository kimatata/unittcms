import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineProject from '../../models/projects.js';
import defineMember from '../../models/members.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const Project = defineProject(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);
  Project.hasMany(Member, { foreignKey: 'projectId' });

  router.get('/', verifySignedIn, async (req, res) => {
    try {
      let projects;
      if (req.query.onlyUserProjects === 'true') {
        projects = await Project.findAll({
          where: {
            userId: req.userId,
          },
        });
      } else {
        // public projects, owned projects, participated projects will be returned
        projects = await Project.findAll({
          include: [
            {
              model: Member,
              attributes: [],
              where: {
                userId: req.userId,
              },
              required: false,
            },
          ],
          where: {
            [Op.or]: [
              { isPublic: true },
              { userId: req.userId },
              sequelize.where(sequelize.col('Members.userId'), req.userId),
            ],
          },
        });
      }
      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
