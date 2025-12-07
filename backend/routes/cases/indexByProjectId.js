import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineProject from '../../models/projects.js';
import defineFolder from '../../models/folders.js';
import defineCase from '../../models/cases.js';
import defineTag from '../../models/tags.js';
import defineRunCase from '../../models/runCases.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';
import { testRunCaseStatus } from '../../config/enums.js';

export default function (sequelize) {
  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Tags = defineTag(sequelize, DataTypes);
  Project.hasMany(Folder, { foreignKey: 'projectId' });
  Folder.hasMany(Case, { foreignKey: 'folderId' });
  Folder.belongsTo(Project, { foreignKey: 'projectId' });
  Case.belongsTo(Folder, { foreignKey: 'folderId' });
  Case.hasMany(RunCase, { foreignKey: 'caseId' });
  Case.belongsToMany(Tags, { through: 'caseTags', foreignKey: 'caseId', otherKey: 'tagId' });
  Tags.belongsToMany(Case, { through: 'caseTags', foreignKey: 'tagId', otherKey: 'caseId' });
  RunCase.belongsTo(Case, { foreignKey: 'caseId' });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(sequelize);

  router.get(
    '/byproject',
    verifySignedIn,
    verifyProjectVisibleFromProjectId,
    verifyProjectVisibleFromRunId,
    async (req, res) => {
      const { projectId, runId, status, tag, search } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      if (!runId) {
        return res.status(400).json({ error: 'runId is required' });
      }

      try {
        // Build where clause for Case model
        const caseWhereClause = {};

        // Handle search parameter
        if (search) {
          const searchTerm = search.trim();

          if (searchTerm.length > 100) {
            return res.status(400).json({ error: 'too long search param' });
          }

          if (searchTerm.length >= 1) {
            caseWhereClause[Op.or] = [
              { title: { [Op.like]: `%${searchTerm}%` } },
              { description: { [Op.like]: `%${searchTerm}%` } },
            ];
          }
        }

        // Handle status filter for RunCase
        let statusFilter = undefined;
        let runCaseRequired = false;
        if (status) {
          const statusValues = status
            .split(',')
            .map((s) => {
              const statusIndex = testRunCaseStatus.indexOf(s.trim().toLowerCase());
              return statusIndex;
            })
            .filter((s) => s !== -1);

          if (statusValues.length > 0) {
            statusFilter = { status: { [Op.in]: statusValues } };
            runCaseRequired = true;
          }
        }

        // Handle tag filter
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

        const cases = await Case.findAll({
          where: caseWhereClause,
          include: [
            {
              model: Folder,
              where: {
                projectId: projectId,
              },
              attributes: [],
            },
            {
              model: RunCase,
              attributes: ['id', 'runId', 'status'],
              // Must be 'true' when filtering by status, otherwise all cases are returned.
              required: runCaseRequired,
              where: {
                [Op.and]: [{ runId: runId }, statusFilter],
              },
            },
            tagInclude,
          ],
        });
        res.json(cases);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    }
  );

  return router;
}
