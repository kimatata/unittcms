const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

const requiredFields = ['title', 'state', 'priority', 'type', 'automationStatus', 'template'];

function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  } else {
    return false;
  }
}

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromFolderId } = require('../../middleware/verifyEditable')(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const folderId = req.query.folderId;

    try {
      if (
        requiredFields.some((field) => {
          return isEmpty(req.body[field]);
        })
      ) {
        return res.status(400).json({
          error: 'Title, state, priority, type, automationStatus, and template are required',
        });
      }

      const { title, state, priority, type, automationStatus, description, template, preConditions, expectedResults } =
        req.body;

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
