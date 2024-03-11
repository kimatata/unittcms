const express = require("express");
const router = express.Router();
const defineStep = require("../../models/steps");
const defineCaseStep = require("../../models/caseSteps");
const { DataTypes, Op } = require("sequelize");

module.exports = function (sequelize) {
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);

  router.delete("/:stepId", async (req, res) => {
    const stepId = req.params.stepId;
    // TODO The caseId should not be specified from the front end, but should be traced from stepId by association.
    const caseId = req.query.parentCaseId;

    const t = await sequelize.transaction();

    try {
      const step = await Step.findByPk(stepId);
      if (!step) {
        await t.rollback();
        return res.status(404).send("Step not found");
      }

      // Get caseStep to be deleted.
      const deletingCaseStep = await CaseStep.findOne({
        where: {
          StepId: stepId,
        },
        transaction: t,
      });

      // Decrease stepNo for all caseSteps with greater than the caseStep to be deleted.
      await CaseStep.update(
        { stepNo: sequelize.literal("stepNo - 1") },
        {
          where: {
            CaseId: caseId,
            stepNo: {
              [Op.gt]: deletingCaseStep.stepNo,
            },
          },
          transaction: t,
        }
      );

      await step.destroy({ transaction: t });

      await t.commit();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
