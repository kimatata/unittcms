import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import definecaseTags from '../../models/caseTags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromCaseId } = editableMiddleware(sequelize);
  const CaseTag = definecaseTags(sequelize, DataTypes);

  router.delete('/:id', verifySignedIn, verifyProjectDeveloperFromCaseId, async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: 'id is required',
      });
    }

    try {
      const deletedCaseTag = await CaseTag.destroy({
        where: {
          id: id,
        },
      });

      if (!deletedCaseTag) {
        return res.status(404).json({ error: 'Case-tag association not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting case-tag association:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
