const express = require('express');
const router = express.Router();
const defineStep = require('../../models/steps');
const defineCaseStep = require('../../models/caseSteps');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectDeveloperFromCaseId } = require('../../middleware/verifyEditable')(sequelize);

  router.post('/', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const newStepNo = req.query.newStepNo;
    const caseId = req.query.caseId;

    const t = await sequelize.transaction();

    try {
      // Update existing stepNo for steps with stepNo greater than or equal to newStepNo
      const maxStepNo = await CaseStep.max('stepNo', {
        where: { caseId: caseId },
        transaction: t,
      });
      if (maxStepNo >= newStepNo) {
        await CaseStep.update(
          { stepNo: sequelize.literal('stepNo + 1') },
          {
            where: {
              caseId: caseId,
              stepNo: { [Op.gte]: newStepNo },
            },
            transaction: t,
          }
        );
      }

      const newStep = await Step.create(
        {
          step: '',
          result: '',
        },
        { transaction: t }
      );

      await CaseStep.create(
        {
          caseId: caseId,
          stepId: newStep.id,
          stepNo: newStepNo,
        },
        { transaction: t }
      );

      await t.commit();
      res.json(newStep);
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
