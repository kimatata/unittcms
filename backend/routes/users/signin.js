import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import defineUser from '../../models/users.js';
import { defaultDangerKey } from './authSettings.js';

export default function (sequelize) {
  const User = defineUser(sequelize, DataTypes);
  const secretKey = process.env.SECRET_KEY || defaultDangerKey;

  router.post('/signin', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({
        where: {
          email: email,
        },
      });
      if (!user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
      const accessToken = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: '24h',
      });
      const expiresAt = Date.now() + 3600 * 1000 * 24; // expire date(ms)

      res.status(200).json({ access_token: accessToken, expires_at: expiresAt, user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Sign up failed');
    }
  });

  return router;
}
