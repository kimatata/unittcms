import express from 'express';
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';
import { SUPPORTED_LOCALES } from '../../config/locale.js';
const router = express.Router();

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.put('/locale', verifySignedIn, async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      const { locale } = req.body;
      if (!locale || locale.trim().length === 0) {
        return res.status(400).send('Locale is required');
      }

      if (!SUPPORTED_LOCALES.includes(locale)) {
        return res.status(400).send('Invalid locale');
      }

      await user.update({ locale: locale.trim() });

      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'role', 'avatarPath', 'locale'],
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
