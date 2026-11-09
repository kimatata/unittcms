import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import { isUsable, toPreview } from './shared.js';
import defineInvitation from '../../models/invitations.js';
import defineProject from '../../models/projects.js';

export default function (sequelize) {
  const Invitation = defineInvitation(sequelize, DataTypes);
  const Project = defineProject(sequelize, DataTypes);

  // Publique à dessein : la page doit dire QUI invite et à quel titre, et
  // l'invité n'a pas encore de compte. Il faut détenir le jeton pour arriver
  // ici, et rien de plus que le nom du projet n'en sort.
  router.get('/:token', async (req, res) => {
    try {
      const invitation = await Invitation.findOne({ where: { token: req.params.token } });
      if (!isUsable(invitation)) {
        return res.status(404).json({ error: 'This invitation is no longer valid' });
      }

      const project = await Project.findByPk(invitation.projectId);
      if (!project) {
        return res.status(404).json({ error: 'This invitation is no longer valid' });
      }

      res.json(toPreview(invitation, project.name));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
