import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import express from 'express';
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);

  // Create avatars folder if it does not exist
  const avatarDir = path.join(__dirname, '../../public/uploads/avatars');
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const fileName = `avatar_${req.userId}_${Date.now()}${ext}`;
      cb(null, fileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Upload avatar
  router.post('/avatar', verifySignedIn, upload.single('avatar'), async (req, res) => {
    try {
      const userId = req.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        // Delete uploaded file if user not found
        fs.unlinkSync(file.path);
        return res.status(404).send('User not found');
      }

      // Delete old avatar if exists
      if (user.avatarPath) {
        // Validate that avatarPath is within expected directory
        const oldAvatarPath = path.join(__dirname, '../../public', user.avatarPath);
        const avatarDirResolved = path.resolve(__dirname, '../../public/uploads/avatars');
        const oldAvatarResolved = path.resolve(oldAvatarPath);

        // Ensure the path is within the avatars directory (prevent path traversal)
        if (oldAvatarResolved.startsWith(avatarDirResolved) && fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Update user with new avatar path
      const avatarPath = `/uploads/avatars/${file.filename}`;
      await user.update({ avatarPath });

      // Return updated user without password
      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error(error);
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete avatar
  router.delete('/avatar', verifySignedIn, async (req, res) => {
    try {
      const userId = req.userId;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      // Delete avatar file if exists
      if (user.avatarPath) {
        // Validate that avatarPath is within expected directory
        const avatarPath = path.join(__dirname, '../../public', user.avatarPath);
        const avatarDirResolved = path.resolve(__dirname, '../../public/uploads/avatars');
        const avatarPathResolved = path.resolve(avatarPath);

        // Ensure the path is within the avatars directory (prevent path traversal)
        if (avatarPathResolved.startsWith(avatarDirResolved) && fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }

      // Update user to remove avatar path
      await user.update({ avatarPath: null });

      // Return updated user without password
      const updatedUser = await User.findByPk(userId, {
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
