const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const { DataTypes } = require('sequelize');
const { verifySinedIn } = require('../../middleware/auth');

module.exports = function (sequelize) {
  const Project = defineProject(sequelize, DataTypes);

  router.get('/', verifySinedIn, async (req, res) => {
    try {
      const projects = await Project.findAll();
      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
