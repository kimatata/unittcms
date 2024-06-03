const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

const requiredFields = ['title', 'state', 'priority', 'type', 'automationStatus', 'template', 'folderId'];

function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  } else {
    return false;
  }
}

module.exports = function (sequelize) {
  const { verifySignedIn, verifyProjectDeveloper } = require('../../middleware/auth')(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectDeveloper, async (req, res) => {
    try {
      if (
        requiredFields.some((field) => {
          return isEmpty(req.body[field]);
        })
      ) {
        return res.status(400).json({
          error: 'Title, state, priority, type, automationStatus, template, and folderId are required',
        });
      }

      const {
        title,
        state,
        priority,
        type,
        automationStatus,
        description,
        template,
        preConditions,
        expectedResults,
        folderId,
      } = req.body;

      const newCase = await Case.create({
        title,
        state,
        priority,
        type,
        automationStatus,
        description,
        template,
        preConditions,
        expectedResults,
        folderId,
      });

      res.json(newCase);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
