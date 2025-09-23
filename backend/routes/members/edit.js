import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineMember from '../../models/members.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const Member = defineMember(sequelize, DataTypes);

  router.put('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;
    const role = req.query.role;

    try {
      const member = await Member.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (!member) {
        return res.status(404).send('Member not found');
      }

      await member.update({
        userId,
        projectId,
        role,
      });
      res.json(member);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
