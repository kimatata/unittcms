import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineInvitation from '../../models/invitations.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const Invitation = defineInvitation(sequelize, DataTypes);

  // Les jetons sont rendus ici : sans serveur mail, le gestionnaire est le
  // facteur, et il doit pouvoir renvoyer un lien qu'il a égaré.
  router.get('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const invitations = await Invitation.findAll({
        where: {
          projectId: projectId,
          acceptedAt: { [Op.is]: null },
          expiresAt: { [Op.gt]: new Date() },
        },
        order: [['id', 'DESC']],
      });
      res.json(invitations);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
