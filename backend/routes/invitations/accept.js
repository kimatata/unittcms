import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { isUsable } from './shared.js';
import { roles, defaultDangerKey } from '../users/authSettings.js';
import defineInvitation from '../../models/invitations.js';
import defineMember from '../../models/members.js';
import defineUser from '../../models/users.js';

const MIN_PASSWORD_LENGTH = 8;

export default function (sequelize) {
  const Invitation = defineInvitation(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);
  const User = defineUser(sequelize, DataTypes);
  const secretKey = process.env.SECRET_KEY || defaultDangerKey;

  /** Le compte déjà connecté, s'il y en a un. Jamais une raison de refuser. */
  const signedInUserId = (req) => {
    const token = req.header('Authorization')?.split(' ')?.pop();
    if (!token) {
      return null;
    }

    try {
      return jwt.verify(token, secretKey).userId;
    } catch {
      return null;
    }
  };

  router.post('/:token/accept', async (req, res) => {
    try {
      const invitation = await Invitation.findOne({ where: { token: req.params.token } });
      if (!isUsable(invitation)) {
        return res.status(404).json({ error: 'This invitation is no longer valid' });
      }

      let userId = signedInUserId(req);
      let accessToken = null;
      let createdUser = null;

      if (!userId) {
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
          return res.status(400).json({ error: 'Email, username and password are required' });
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
          return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        }

        const taken = await User.findOne({ where: { email } });
        if (taken) {
          // On ne fusionne pas deux identités sur une égalité d'adresse : la
          // personne se connecte, puis rouvre le lien.
          return res
            .status(409)
            .json({ error: 'An account already uses this address. Sign in, then open the link again.' });
        }

        // Le rôle est forcé. `signup` fait du premier compte un administrateur ;
        // par une invitation, cela ferait d'un invité l'administrateur d'une
        // instance vide.
        const user = await User.create({
          email,
          username,
          password: await bcrypt.hash(password, 10),
          role: roles.findIndex((entry) => entry.uid === 'user'),
        });
        userId = user.id;
        accessToken = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '24h' });
        // Même forme que l'inscription : l'interface ouvre la session avec ce
        // qu'on lui rend, et elle a besoin du compte, pas seulement du jeton.
        user.password = undefined;
        createdUser = user;
      }

      const existingMember = await Member.findOne({
        where: { userId: userId, projectId: invitation.projectId },
      });
      if (!existingMember) {
        await Member.create({ userId: userId, projectId: invitation.projectId, role: invitation.role });
      }

      // Consommée en dernier : si quelque chose au-dessus échoue, le lien sert
      // encore. Un siège pris deux fois est moins grave qu'un invité enfermé
      // dehors avec un lien mort.
      await invitation.update({ acceptedAt: new Date() });

      res.json({
        projectId: invitation.projectId,
        ...(accessToken
          ? { access_token: accessToken, expires_at: Date.now() + 3600 * 1000 * 24, user: createdUser }
          : {}),
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
