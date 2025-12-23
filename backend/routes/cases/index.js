import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';
import defineFolder from '../../models/folders.js';

import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromFolderId } = visibilityMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);

  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });
  Case.belongsTo(Folder, { foreignKey: 'folderId' });

  async function getAllChildFolderIds(parentFolderId) {
    if (!parentFolderId) {
      return [];
    }

    const folderIds = [parentFolderId];
    const childFolders = await Folder.findAll({
      where: { parentFolderId: parentFolderId },
    });

    for (const child of childFolders) {
      const nestedIds = await getAllChildFolderIds(child.id);
      folderIds.push(...nestedIds);
    }

    return folderIds;
  }

  router.get('/', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { folderId, search, priority, type, tag } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    try {
      const allFolderIds = await getAllChildFolderIds(Number(folderId));
      const whereClause = {
        folderId: { [Op.in]: allFolderIds },
      };

      if (search) {
        const searchTerm = search.trim();

        if (searchTerm.length > 100) {
          return res.status(400).json({ error: 'too long search param' });
        }

        if (searchTerm.length >= 1) {
          whereClause[Op.or] = [
            { title: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } },
          ];
        }
      }

      if (priority) {
        const priorityValues = priority
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p));
        if (priorityValues.length > 0) {
          whereClause.priority = { [Op.in]: priorityValues };
        }
      }

      if (type) {
        const typeValues = type
          .split(',')
          .map((t) => parseInt(t.trim(), 10))
          .filter((t) => !isNaN(t));
        if (typeValues.length > 0) {
          whereClause.type = { [Op.in]: typeValues };
        }
      }

      const tagInclude = {
        model: Tags,
        attributes: ['id', 'name'],
        through: { attributes: [] },
      };

      if (tag) {
        const tagIds = tag
          .split(',')
          .map((t) => parseInt(t.trim(), 10))
          .filter((t) => !isNaN(t));

        if (tagIds.length > 0) {
          tagInclude.where = { id: { [Op.in]: tagIds } };
          tagInclude.required = true;
        }
      }

      const folderInclude = {
        model: Folder,
        attributes: ['id', 'name'],
        required: false,
      };

      const cases = await Case.findAll({
        where: whereClause,
        include: [tagInclude, folderInclude],
      });
      res.json(cases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
