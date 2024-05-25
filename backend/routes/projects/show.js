const express = require('express');
const router = express.Router();
const defineProject = require('../../models/projects');
const defineFolder = require('../../models/folders');
const { DataTypes } = require('sequelize');
const { verifySinedIn } = require('../../middleware/auth');

module.exports = function (sequelize) {
  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  Project.hasMany(Folder, { foreignKey: 'projectId' });

  router.get('/:projectId', verifySinedIn, async (req, res) => {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    // if project is private, only project owner can access
    if (!project.isPublic && project.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: Folder,
          },
        ],
      });
      if (!project) {
        return res.status(404).send('Project not found');
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
