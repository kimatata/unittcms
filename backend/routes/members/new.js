import express from 'express';
const router = express.Router();
import { memberRoles } from '../../routes/users/authSettings.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(db);

  router.post('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;

    try {
      // Check if the record already exists
      const existingMember = await db.repos.members.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (existingMember) {
        return res.status(400).send('Record already exists');
      }

      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'reporter');
      const newMember = await db.repos.members.create({
        userId: userId,
        projectId: projectId,
        role: managerRoleIndex,
      });

      res.json(newMember);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
