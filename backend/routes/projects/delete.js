const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyProjectOwner } = require('../../middleware/auth')(sequelize);
  const Project = defineProject(sequelize, DataTypes);

  router.delete('/:projectId', verifySignedIn, verifyProjectOwner, async (req, res) => {
    const projectId = req.params.projectId;
    try {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).send('Project not found');
      }
      await project.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
