const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const Project = defineProject(sequelize, DataTypes);

  router.post('/', verifySignedIn, async (req, res) => {
    try {
      const { name, detail, isPublic } = req.body;
      const newProject = await Project.create({
        name,
        detail,
        isPublic,
        userId: req.userId,
      });
      res.json(newProject);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
