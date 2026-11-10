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
      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).send('Project not found');
      }

      // Two `hasMany` branches in ONE query make Sequelize emit a cartesian
      // product: folders x cases x runs x runCases. On a project with ~1000
      // cases and 9 runs that is roughly a million rows, each one carrying the
      // full case text — the request never returns and the process dies with
      // "JavaScript heap out of memory".
      //
      // Two separate queries, one join each, and only the columns the page
      // actually aggregates (see aggregate.ts: counts, case type and priority,
      // run case status and createdAt). The JSON shape is unchanged.
      const [folders, runs] = await Promise.all([
        Folder.findAll({
          where: { projectId },
          attributes: ['id'],
          include: [{ model: Case, attributes: ['id', 'type', 'priority'] }],
        }),
        Run.findAll({
          where: { projectId },
          attributes: ['id'],
          include: [{ model: RunCase, attributes: ['id', 'status', 'createdAt'] }],
        }),
      ]);

      res.json({ ...project.toJSON(), Folders: folders, Runs: runs });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
