const express = require('express');
const router = express.Router();
const defineRun = require('../../models/runs');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
  const Run = defineRun(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectReporterFromProjectId, async (req, res) => {
    try {
      const projectId = req.query.projectId;
      const { name, configurations, description, state } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Name and projectId are required' });
      }

      const newRun = await Run.create({
        name,
        configurations,
        description,
        state,
        projectId,
      });

      res.json(newRun);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
