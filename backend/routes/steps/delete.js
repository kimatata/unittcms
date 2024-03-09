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
    const caseId = req.query.parentCaseId;

    try {
      const step = await Step.findByPk(stepId);
      if (!step) {
        return res.status(404).send("Step not found");
      }

      // Get caseStep to be deleted.
      const deletingCaseStep = await CaseStep.findOne({
        where: {
          StepId: stepId,
        },
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
        }
      );

      await step.destroy();

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  return router;
};
