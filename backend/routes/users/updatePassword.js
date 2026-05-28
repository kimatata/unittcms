import express from 'express';
import bcrypt from 'bcrypt';
import authMiddleware from '../../middleware/auth.js';
const router = express.Router();

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // Change user password
  router.put('/password', verifySignedIn, async (req, res) => {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).send('Current password and new password are required');
      }

      if (newPassword.length < 8) {
        return res.status(400).send('New password must be at least 8 characters');
      }

      const user = await db.repos.users.findByPk(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).send('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hashedPassword });

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
