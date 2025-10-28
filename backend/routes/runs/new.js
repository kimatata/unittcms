import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineProject from '../../models/projects.js';
import defineFolder from '../../models/folders.js';
import defineRun from '../../models/runs.js';
import defineRunCase from '../../models/runCases.js';
import defineCase from '../../models/cases.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromProjectId } = editableMiddleware(sequelize);
  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  Project.hasMany(Folder, { foreignKey: 'projectId' });
  Folder.hasMany(Case, { foreignKey: 'folderId' });
  Folder.belongsTo(Project, { foreignKey: 'projectId' });
  Case.belongsTo(Folder, { foreignKey: 'folderId' });
  Case.hasMany(RunCase, { foreignKey: 'caseId' });

  router.post('/', verifySignedIn, verifyProjectReporterFromProjectId, async (req, res) => {
    const t = await sequelize.transaction();

    try {
      const projectId = req.query.projectId;
      const { name, configurations, description, state } = req.body;
      if (!name || !projectId) {
        return res.status(400).json({ error: 'Name and projectId are required' });
      }

      const newRun = await Run.create(
        {
          name,
          configurations,
          description,
          state,
          projectId,
        },
        { transaction: t }
      );

      const projectCases = await Case.findAll(
        {
          include: [
            {
              model: Folder,
              where: {
                projectId: projectId,
              },
              attributes: [],
            },
          ],
        },
        { transaction: t }
      );

      const runCasesToCreate = [];
      for (const _case of projectCases) {
        runCasesToCreate.push({
          runId: newRun.id,
          caseId: _case.id,
          status: 0,
        });
      }

      const chunkSize = 100;
      for (let i = 0; i < runCasesToCreate.length; i += chunkSize) {
        const chunk = runCasesToCreate.slice(i, i + chunkSize);
        await RunCase.bulkCreate(chunk, { transaction: t });
      }

      t.commit();
      res.json(newRun);
    } catch (error) {
      t.rollback();
      console.error('Error creating new run:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
