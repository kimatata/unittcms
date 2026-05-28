import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(db);

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
      const testCase = await db.repos.cases.findByPk(caseId);
      if (!testCase) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const currentAssociations = await db.repos.caseTags.findAll({
        where: { caseId },
      });

      const currentTagIds = currentAssociations.map((ct) => ct.tagId);

      const tagsToAdd = tagIds.filter((id) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter((id) => !tagIds.includes(id));

      if (tagsToAdd.length > 0) {
        const validTags = await db.repos.tags.findAll({ where: { id: tagsToAdd } });
        const newLinks = validTags.map((tag) => ({ caseId, tagId: tag.id }));
        await db.repos.caseTags.bulkCreate(newLinks);
      }

      if (tagsToRemove.length > 0) {
        await db.repos.caseTags.destroy({
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
