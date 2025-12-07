import express from 'express';
import bcrypt from 'bcrypt';
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';
const router = express.Router();

export default function (sequelize) {
  const { verifySignedIn, verifyAdmin } = authMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);

  // Admin resets another user's password
  router.put('/:id/password', verifySignedIn, verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).send('New password is required');
      }

      if (newPassword.length < 8) {
        return res.status(400).send('New password must be at least 8 characters');
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).send('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      return res.json({ user: { id: user.id } });
    } catch (error) {
      console.error(error);
      return res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
