import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromFolderId } = visibilityMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);

  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });

  router.get('/', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { caseId } = req.query;

    if (!caseId) {
      return res.status(400).json({
        error: 'caseId is required',
      });
    }

    try {
      const caseExists = await Case.findByPk(caseId);
      if (!caseExists) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const tags = await Tags.findAll({
        include: [
          {
            model: Case,
            where: { id: caseId },
            attributes: [],
            through: { attributes: ['id'] },
          },
        ],
        attributes: ['id', 'name'],
      });

      res.json(tags);
    } catch (error) {
      console.error('Error fetching case tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
