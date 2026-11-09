import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import { expiryFromNow, isMemberRole, newToken } from './shared.js';
import defineInvitation from '../../models/invitations.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const Invitation = defineInvitation(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    try {
      const projectId = req.query.projectId;
      const { role, email } = req.body;

      if (!isMemberRole(role)) {
        return res.status(400).json({ error: 'role must be a member role' });
      }

      const invitation = await Invitation.create({
        token: newToken(),
        projectId,
        role,
        email: email || null,
        createdById: req.userId,
        expiresAt: expiryFromNow(),
      });

      res.json(invitation);
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
