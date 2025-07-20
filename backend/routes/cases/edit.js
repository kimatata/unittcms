const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const defineCase = require('../../models/cases');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromCaseId } = require('../../middleware/verifyEditable')(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  router.put('/:caseId', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const caseId = req.params.caseId;
    const updateCase = req.body;
    try {
      const testcase = await Case.findByPk(caseId);
      if (!testcase) {
        return res.status(404).send('Case not found');
      }

      if (updateCase.Steps) {
        delete updateCase.Steps;
      }

      await testcase.update(updateCase);
      res.json(testcase);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
