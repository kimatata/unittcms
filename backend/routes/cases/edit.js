const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const defineStep = require('../../models/steps');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);

  router.put('/:caseId', async (req, res) => {
    const caseId = req.params.caseId;
    const updateCase = req.body;
    try {
      const testcase = await Case.findByPk(caseId);
      if (!testcase) {
        return res.status(404).send('Case not found');
      }

      // if Case has Steps, update Steps as well
      if (updateCase.Steps) {
        // Delete existing steps
        const steps = updateCase.Steps;
        await Promise.all(
          steps.map(async (step) => {
            const existingStep = await Step.findByPk(step.id);
            if (existingStep) {
              await existingStep.update(step);
            }
          })
        );
      }

      delete updateCase.Steps;
      await testcase.update(updateCase);
      res.json(testcase);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
