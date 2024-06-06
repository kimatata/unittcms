const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  router.post('/bulkdelete', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { caseIds } = req.body;
    if (!caseIds || !Array.isArray(caseIds)) {
      return res.status(400).send('Invalid caseIds array');
    }

    try {
      await Case.destroy({ where: { id: caseIds } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
