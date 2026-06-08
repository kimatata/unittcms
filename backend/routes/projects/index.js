import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const Project = db.repos.projects;
  const Member = db.repos.members;

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
        const memberRows = await Member.findAll({
          where: { userId: req.userId },
          attributes: ['projectId'],
        });
        const memberProjectIds = memberRows.map((m) => m.projectId);

        projects = await Project.findAll({
          where: {
            [Op.or]: [
              { isPublic: true },
              { userId: req.userId },
              ...(memberProjectIds.length > 0 ? [{ id: { [Op.in]: memberProjectIds } }] : []),
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
