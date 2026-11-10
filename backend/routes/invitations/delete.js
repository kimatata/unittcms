import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineInvitation from '../../models/invitations.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const Invitation = defineInvitation(sequelize, DataTypes);

  // Le projet est exigé en requête : il porte le contrôle de droits, et une
  // invitation ne doit pas pouvoir être révoquée depuis un autre projet.
  router.delete('/:invitationId', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    try {
      const { invitationId } = req.params;

      const invitation = await Invitation.findByPk(invitationId);
      if (!invitation || String(invitation.projectId) !== String(req.query.projectId)) {
        return res.status(404).send('Invitation not found');
      }

      await invitation.destroy();
      res.json({ message: 'Invitation revoked successfully' });
    } catch (error) {
      console.error('Error revoking invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
