import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

import defineTag from '../../models/tags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(sequelize);

  const Tags = defineTag(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { name } = req.body;
    const projectId = req.query.projectId;

    if (!name || !projectId) {
      return res.status(400).json({
        error: 'name and projectId are required',
      });
    }
    const trimmedName = name.trim();

    if (trimmedName.length < 3 || trimmedName.length > 20) {
      return res.status(400).json({
        error: 'name must be between 3 and 20 characters long',
      });
    }

    try {
      if (await Tags.findOne({ where: { name: trimmedName, projectId } })) {
        return res.status(409).json({ error: 'Tag name must be unique' });
      }

      const newTag = await Tags.create({
        name: trimmedName,
        projectId,
      });
      res.status(201).json(newTag);
    } catch (error) {
      console.error('Error creating new tag:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Tag name must be unique' });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
