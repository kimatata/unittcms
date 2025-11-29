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
      const { projectId, runId, status, tag } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      if (!runId) {
        return res.status(400).json({ error: 'runId is required' });
      }

      let errorMessage = null;
      let statusFilter = undefined;
      if (status) {
        let statusIndex = testRunCaseStatus.indexOf(status.toLowerCase());
        if (statusIndex === -1) {
          errorMessage = `Invalid status filter: ${status}`;
        } else {
          statusFilter = { status: statusIndex };
        }
      }

      let tagFilter = tag ? { name: tag } : undefined;

      if (errorMessage) {
        return res.status(400).json({ error: errorMessage });
      }

      try {
        const cases = await Case.findAll({
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
              required: statusFilter ? true : false,
              where: {
                [Op.and]: [{ runId: runId }, statusFilter],
              },
            },
            {
              model: Tags,
              attributes: ['id', 'name'],
              through: { attributes: [] },
              ...(tagFilter ? { where: tagFilter } : {}),
            },
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
