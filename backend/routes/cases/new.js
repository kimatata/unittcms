import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import { Op } from 'sequelize';
import defineCase from '../../models/cases.js';
import definecaseTags from '../../models/caseTags.js';
import defineTag from '../../models/tags.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

const requiredFields = ['title', 'state', 'priority', 'type', 'automationStatus', 'template'];

function isEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  } else {
    return false;
  }
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectDeveloperFromFolderId } = editableMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);
  const CaseTag = definecaseTags(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);

  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });

  router.post('/', verifySignedIn, verifyProjectDeveloperFromFolderId, async (req, res) => {
    const folderId = req.query.folderId;

    try {
      if (
        requiredFields.some((field) => {
          return isEmpty(req.body[field]);
        })
      ) {
        return res.status(400).json({
          error: 'Title, state, priority, type, automationStatus, and template are required',
        });
      }

      const {
        title,
        state,
        priority,
        type,
        automationStatus,
        description,
        template,
        preConditions,
        expectedResults,
        tags,
      } = req.body;

      if (Array.isArray(tags) && tags.length > 0) {
        const existingTags = await Tags.findAll({
          where: { id: { [Op.in]: tags } },
        });

        if (existingTags.length !== tags.length) {
          return res.status(400).json({ error: 'One or more tags do not exist' });
        }
      }

      const newCase = await Case.create({
        title,
        state,
        priority,
        type,
        automationStatus,
        description,
        template,
        preConditions,
        expectedResults,
        folderId,
      });

      if (Array.isArray(tags) && tags.length > 0) {
        const caseTagRecords = tags.map((tagId) => ({
          caseId: newCase.id,
          tagId,
        }));
        await CaseTag.bulkCreate(caseTagRecords);
      }

      const createdCase = await Case.findByPk(newCase.id, {
        include: [
          {
            model: Tags,
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
        ],
      });

      return res.status(201).json(createdCase);
    } catch (error) {
      console.error('Error creating new case:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
