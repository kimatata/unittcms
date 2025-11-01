import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import defineCaseTag from '../../models/caseTags.js';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(sequelize);
  const CaseTag = defineCaseTag(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Tag = defineTag(sequelize, DataTypes);

  router.post('/update', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const { tagIds } = req.body;
    const caseId = req.query.caseId;

    if (!caseId || !Array.isArray(tagIds)) {
      return res.status(400).json({ error: 'caseId and tagIds[] are required' });
    }

    if (tagIds.length > 5) {
      return res.status(400).json({ error: 'Maximum of 5 tags allowed' });
    }

    try {
      const testCase = await Case.findByPk(caseId);
      if (!testCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const currentAssociations = await CaseTag.findAll({
        where: { caseId },
      });

      const currentTagIds = currentAssociations.map((ct) => ct.tagId);

      const tagsToAdd = tagIds.filter((id) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter((id) => !tagIds.includes(id));

      if (tagsToAdd.length > 0) {
        const validTags = await Tag.findAll({ where: { id: tagsToAdd } });
        const newLinks = validTags.map((tag) => ({ caseId, tagId: tag.id }));
        await CaseTag.bulkCreate(newLinks);
      }

      if (tagsToRemove.length > 0) {
        await CaseTag.destroy({
          where: { caseId, tagId: tagsToRemove },
        });
      }

      res.status(200).json({ message: 'Tags updated successfully' });
    } catch (error) {
      console.error('Error updating case tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
