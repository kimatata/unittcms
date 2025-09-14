import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineProject from '../../models/projects';
import defineFolder from '../../models/folders';
import defineRun from '../../models/runs';
import authMiddleware from '../../middleware/auth';
import editableMiddleware from '../../middleware/verifyEditable';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectOwner } = editableMiddleware(sequelize);
  const Project = defineProject(sequelize, DataTypes);
  const Folder = defineFolder(sequelize, DataTypes);
  const Run = defineRun(sequelize, DataTypes);

  router.delete('/:projectId', verifySignedIn, verifyProjectOwner, async (req, res) => {
    const projectId = req.params.projectId;
    const t = await sequelize.transaction();

    try {
      const project = await Project.findByPk(projectId);
      if (!project) {
        await t.rollback();
        return res.status(404).send('Project not found');
      }

      await Folder.destroy({ where: { projectId: projectId }, transaction: t });
      await Run.destroy({ where: { projectId: projectId }, transaction: t });

      await project.destroy({ transaction: t });

      await t.commit();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
