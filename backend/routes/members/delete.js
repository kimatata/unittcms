import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(db);

  router.delete('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;

    try {
      // Get Member to be deleted.
      const deletingMember = await db.repos.members.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (!deletingMember) {
        return res.status(404).send('Member not found');
      }

      await deletingMember.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
