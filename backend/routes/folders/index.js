const express = require('express');
const router = express.Router();
const defineFolder = require('../../models/folders');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Folder = defineFolder(sequelize, DataTypes);

  router.get('/', async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const folders = await Folder.findAll({
        where: {
          projectId: projectId,
        },
      });
      res.json(folders);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
