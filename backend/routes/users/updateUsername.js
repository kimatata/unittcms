import express from 'express';
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';
const router = express.Router();

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.put('/username', verifySignedIn, async (req, res) => {
    try {
      const userId = req.userId;
      const { username } = req.body;

      if (!username || username.trim().length === 0) {
        return res.status(400).send('Username is required');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      await user.update({ username: username.trim() });

      // Return updated user without password
      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
