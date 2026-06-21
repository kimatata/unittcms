import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineStep from '../../models/steps.js';
import defineCaseStep from '../../models/caseSteps.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(sequelize);

  router.post('/update', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const caseId = Number(req.query.caseId);
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

    const updateStep = async (step) => {
      await Step.update(
        {
          step: step.step,
          result: step.result,
        },
        {
          where: { id: step.id },
          transaction: t,
        }
      );
      await CaseStep.update(
        {
          stepNo: step.caseSteps.stepNo,
        },
        {
          where: { caseId, stepId: step.id },
          transaction: t,
        }
      );
      return step;
    };

    const deleteCaseStep = async (caseStep) => {
      await CaseStep.destroy({
        where: { caseId, stepId: caseStep.stepId },
        transaction: t,
      });
      await Step.destroy({
        where: { id: caseStep.stepId },
        transaction: t,
      });
      return null;
    };

    try {
      const existingCaseSteps = await CaseStep.findAll({
        where: { caseId: caseId },
        transaction: t,
      });
      const stepsIdsFromRequest = steps.filter((step) => step.id != null).map((step) => step.id);
      const caseStepsToDelete = existingCaseSteps.filter(
        (existingStep) => !stepsIdsFromRequest.includes(existingStep.stepId)
      );

      if (caseStepsToDelete.length > 0) {
        await Promise.all(caseStepsToDelete.map((caseStep) => deleteCaseStep(caseStep)));
      }

      const results = await Promise.all(
        steps.map(async (step) => {
          if (step.editState === 'new') {
            return createStep(step);
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
}
