import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineProject from '../../models/projects';
import defineFolder from '../../models/folders';
import defineCase from '../../models/cases';
import defineRunCase from '../../models/runCases';
import authMiddleware from '../../middleware/auth';
import visibilityMiddleware from '../../middleware/verifyVisble';

export default function (sequelize) {
  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  Project.hasMany(Folder, { foreignKey: 'projectId' });
  Folder.hasMany(Case, { foreignKey: 'folderId' });
  Folder.belongsTo(Project, { foreignKey: 'projectId' });
  Case.belongsTo(Folder, { foreignKey: 'folderId' });
  Case.hasMany(RunCase, { foreignKey: 'caseId' });
  RunCase.belongsTo(Case, { foreignKey: 'caseId' });
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(sequelize);

  router.get('/byproject', verifySignedIn, verifyProjectVisibleFromProjectId, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
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
          },
        ],
      });
      res.json(cases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
