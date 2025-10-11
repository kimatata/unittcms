import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';
import definecaseTags from '../../models/caseTags.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);
  const CaseTag = definecaseTags(sequelize, DataTypes);

  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });

  router.put('/:caseId', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const caseId = req.params.caseId;
    const updateCase = req.body;
    try {
      const testcase = await Case.findByPk(caseId);

      if (Array.isArray(updateCase.tags) && updateCase.tags.length > 0) {
        const existingTags = await Tags.findAll({
          where: { id: { [Op.in]: updateCase.tags } },
        });

        if (existingTags.length !== updateCase.tags.length) {
          return res.status(400).json({ error: 'One or more tags do not exist' });
        }
      }

      if (!testcase) {
        return res.status(404).send('Case not found');
      }

      if (updateCase.Steps) {
        delete updateCase.Steps;
      }

      await testcase.update(updateCase);

      if (Array.isArray(updateCase.tags)) {
        await CaseTag.destroy({
          where: {
            caseId: caseId,
          },
        });

        if (updateCase.tags.length > 0) {
          const caseTagRecords = updateCase.tags.map((tagId) => ({
            caseId: caseId,
            tagId,
          }));

          await CaseTag.bulkCreate(caseTagRecords);
        }
      }

      const caseRecord = await Case.findByPk(caseId, {
        include: [
          {
            model: Tags,
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      res.json(caseRecord);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
