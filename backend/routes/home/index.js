import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineProject from '../../models/projects.js';
import defineFolder from '../../models/folders.js';
import defineCase from '../../models/cases.js';
import defineRun from '../../models/runs.js';
import defineRunCase from '../../models/runCases.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);

  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  Project.hasMany(Folder, { foreignKey: 'projectId' });
  Folder.hasMany(Case, { foreignKey: 'folderId' });
  Project.hasMany(Run, { foreignKey: 'projectId' });
  Run.hasMany(RunCase, { foreignKey: 'runId' });

  router.get('/:projectId', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const projectId = req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const project = await Project.findByPk(projectId, {
        include: [
          {
            model: Folder,
            include: [{ model: Case }],
          },
          { model: Run, include: [{ model: RunCase }] },
        ],
      });
      if (!project) {
        return res.status(404).send('Project not found');
      }
      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
