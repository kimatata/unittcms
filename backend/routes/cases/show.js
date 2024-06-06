const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const defineStep = require('../../models/steps');
const defineAttachment = require('../../models/attachments');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const Attachment = defineAttachment(sequelize, DataTypes);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });
  Case.belongsToMany(Attachment, { through: 'caseAttachments' });
  Attachment.belongsToMany(Case, { through: 'caseAttachments' });
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromCaseId } = require('../../middleware/verifyVisible')(sequelize);

  router.get('/:caseId', verifySignedIn, verifyProjectVisibleFromCaseId, async (req, res) => {
    const caseId = req.params.caseId;

    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required' });
    }

    try {
      const testcase = await Case.findByPk(caseId, {
        include: [
          {
            model: Step,
            through: { attributes: ['stepNo'] },
          },
          {
            model: Attachment,
          },
        ],
      });
      return res.json(testcase);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
