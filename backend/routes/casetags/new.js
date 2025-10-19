import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import definecaseTags from '../../models/caseTags.js';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(sequelize);
  const CaseTag = definecaseTags(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const { caseId, tagId } = req.body;

    if (!caseId || !tagId) {
      return res.status(400).json({
        error: 'caseId and tagId are required',
      });
    }

    try {
      const caseExists = await Case.findByPk(caseId);
      if (!caseExists) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const tagExists = await Tags.findByPk(tagId);
      if (!tagExists) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      const existingAssociation = await CaseTag.findOne({
        where: { caseId, tagId },
      });

      if (existingAssociation) {
        return res.status(409).json({ error: 'Tag is already associated with this case' });
      }

      const newCaseTag = await CaseTag.create({
        caseId,
        tagId,
      });

      res.status(201).json(newCaseTag);
    } catch (error) {
      console.error('Error creating case-tag association:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
