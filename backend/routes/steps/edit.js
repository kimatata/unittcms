const express = require('express');
const router = express.Router();
const defineStep = require('../../models/steps');
const defineCaseStep = require('../../models/caseSteps');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromCaseId } = require('../../middleware/verifyEditable')(sequelize);

  router.post('/update', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const caseId = req.query.caseId;
    const steps = req.body;
    const t = await sequelize.transaction();

    const createStep = async (step) => {
      const newStep = await Step.create(
        {
          step: step.step,
          result: step.result,
        },
        { transaction: t }
      );
      await CaseStep.create(
        {
          caseId: caseId,
          stepId: newStep.id,
          stepNo: step.caseSteps.stepNo,
        },
        { transaction: t }
      );
      return newStep;
    };

    const deleteStep = async (step) => {
      await CaseStep.destroy({
        where: { stepId: step.id },
        transaction: t,
      });
      await Step.destroy({
        where: { id: step.id },
        transaction: t,
      });
      return null;
    };

    const updateStep = async (step) => {
      await Step.update(step, {
        where: { id: step.id },
        transaction: t,
      });
      await CaseStep.update(
        {
          stepNo: step.caseSteps.stepNo,
        },
        {
          where: { stepId: step.id },
          transaction: t,
        }
      );
      return step;
    };
    try {
      const results = await Promise.all(
        steps.map(async (step) => {
          if (step.editState === 'new') {
            return createStep(step);
          } else if (step.editState === 'deleted') {
            return deleteStep(step);
          } else if (step.editState === 'changed') {
            return updateStep(step);
          } else if (step.editState === 'notChanged') {
            return step;
          }
        })
      );

      await t.commit();
      res.json(results.filter((result) => result !== null));
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
