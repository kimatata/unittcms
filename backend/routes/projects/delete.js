import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectOwner } = editableMiddleware(db);
  const Project = db.repos.projects;
  const Folder = db.repos.folders;
  const Run = db.repos.runs;

  router.delete('/:projectId', verifySignedIn, verifyProjectOwner, async (req, res) => {
    const projectId = req.params.projectId;
    const t = await db.sequelize.transaction();

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
