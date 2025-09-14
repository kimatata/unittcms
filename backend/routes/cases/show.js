import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases';
import defineStep from '../../models/steps';
import defineAttachment from '../../models/attachments';
import authMiddleware from '../../middleware/auth';
import visibilityMiddleware from '../../middleware/verifyVisble';

export default function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const Attachment = defineAttachment(sequelize, DataTypes);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });
  Case.belongsToMany(Attachment, { through: 'caseAttachments' });
  Attachment.belongsToMany(Case, { through: 'caseAttachments' });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromCaseId } = visibilityMiddleware(sequelize);

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
}
