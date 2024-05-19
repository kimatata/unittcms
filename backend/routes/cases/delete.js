const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);

  router.delete('/:caseId', async (req, res) => {
    const caseId = req.params.caseId;
    try {
      const testcase = await Case.findByPk(caseId);
      if (!testcase) {
        return res.status(404).send('Case not found');
      }
      await testcase.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
