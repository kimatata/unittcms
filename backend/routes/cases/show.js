import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineTag from '../../models/tags.js';
import defineAttachment from '../../models/attachments.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);
  const Attachment = defineAttachment(sequelize, DataTypes);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });
  Case.belongsToMany(Attachment, { through: 'caseAttachments' });
  Attachment.belongsToMany(Case, { through: 'caseAttachments' });
  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });
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
          {
            model: Tags,
            attributes: ['id', 'name'],
            through: { attributes: [] },
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
