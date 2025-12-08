import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import defineTag from '../../models/tags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(sequelize);

  const Tags = defineTag(sequelize, DataTypes);

  router.put('/:tagId', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { tagId } = req.params;
    const projectId = req.query.projectId;

    if (!tagId || !projectId) {
      return res.status(400).json({
        error: 'tagId and projectId are required',
      });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'name is required',
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 20) {
      return res.status(400).json({
        error: 'name must be between 3 and 20 characters long',
      });
    }

    try {
      const existingTag = await Tags.findOne({
        where: { name: trimmedName, projectId, id: { [Op.ne]: tagId } },
        attributes: ['id'],
      });

      if (existingTag) {
        return res.status(409).json({ error: 'Tag name must be unique' });
      }

      const [updated] = await Tags.update({ name: trimmedName }, { where: { id: tagId, projectId } });

      if (updated === 0) {
        return res.status(404).json({ error: 'Tag not found' });
      }

      const updatedTag = await Tags.findOne({
        where: { id: tagId, projectId },
      });

      if (!updatedTag) {
        return res.status(404).json({ error: 'Tag not found after update' });
      }

      res.status(200).json(updatedTag);
    } catch (error) {
      console.error('Error updating tag:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
