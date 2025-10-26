import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineStep from '../../models/steps.js';
import defineCaseStep from '../../models/caseSteps.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);
  const Step = defineStep(sequelize, DataTypes);
  const CaseStep = defineCaseStep(sequelize, DataTypes);
  Case.belongsToMany(Step, { through: 'caseSteps' });
  Step.belongsToMany(Case, { through: 'caseSteps' });

  // TODO:  Implement a safer middleware to check permissions based on the actual caseId (in this case, multiples case ids)
  router.post('/clone', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { caseIds, targetFolderId } = req.body;

    if (!Array.isArray(caseIds) || caseIds.length === 0 || !targetFolderId) {
      return res.status(400).json({ error: 'caseIds(array) and targetFolderId are required' });
    }

    try {
      const caseRecords = await Case.findAll({
        where: { id: caseIds },
        include: [{ model: Step, through: { attributes: ['stepNo'] } }],
      });

      if (caseRecords.length !== caseIds.length) {
        return res.status(404).json({ error: 'Some cases not found' });
      }

      const cases = caseRecords.map((c) => c.get({ plain: true }));

      const clonedCases = cases.map((c) => {
        // eslint-disable-next-line no-unused-vars
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedCase } = c;
        return { ...clonedCase, folderId: targetFolderId };
      });

      await sequelize.transaction(async (t) => {
        for (const c of clonedCases) {
          const newCase = await Case.create(c, { transaction: t });

          if (c.Steps) {
            const clonedSteps = c.Steps.map((s) => {
              // eslint-disable-next-line no-unused-vars
              const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clonedStep } = s;
              return clonedStep;
            });

            const newStep = await Step.bulkCreate(clonedSteps, { transaction: t });
            const newCaseSteps = newStep.map((step, index) => ({
              caseId: newCase.id,
              stepId: step.id,
              stepNo: clonedSteps[index].caseSteps.stepNo,
            }));

            await CaseStep.bulkCreate(newCaseSteps, { transaction: t });
          }
        }
      });

      res.status(200).json({ message: 'Cases cloned successfully' });
    } catch (error) {
      console.error('Error cloning cases:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
