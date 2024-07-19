const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectOwner } = require('../../middleware/verifyEditable')(sequelize);
  const Project = defineProject(sequelize, DataTypes);

  router.put('/:projectId', verifySignedIn, verifyProjectOwner, async (req, res) => {
    const projectId = req.params.projectId;
    const { name, detail, isPublic } = req.body;
    try {
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).send('Project not found');
      }
      await project.update({
        name,
        detail,
        isPublic,
      });
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
