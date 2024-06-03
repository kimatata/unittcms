const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const Project = defineProject(sequelize, DataTypes);

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
        projects = await Project.findAll({
          where: {
            [Op.or]: [{ isPublic: true }, { userId: req.userId }],
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
};
