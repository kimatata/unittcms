import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineUser from '../../models/users.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn, verifyAdmin } = authMiddleware(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyAdmin, async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
