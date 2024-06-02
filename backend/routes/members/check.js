const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const defineProject = require('../../models/projects');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const Member = defineMember(sequelize, DataTypes);
  const Project = defineProject(sequelize, DataTypes);

  router.get('/check', verifySignedIn, async (req, res) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    try {
      const members = await Member.findAll({
        where: {
          userId: userId,
        },
      });

      const myProjects = await Project.findAll({
        where: {
          userId: userId,
        },
      });

      const projectRoles = members.map((member) => {
        return { projectId: member.projectId, isOwner: false, isMember: true, role: member.role };
      });
      const ownProjectRoles = myProjects.map((project) => {
        return { projectId: project.id, isOwner: true, isMember: true, role: 0 };
      });
      projectRoles.push(...ownProjectRoles);

      res.json(projectRoles);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
