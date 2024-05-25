const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');
const { roles, defaultDangerKey } = require('./authSettings');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = function (sequelize) {
  const User = defineUser(sequelize, DataTypes);
  const secretKey = process.env.SECRET_KEY || defaultDangerKey;

  router.post('/signup', async (req, res) => {
    try {
      const { email, password, username } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const userCount = await User.count();
      const initialRole =
        userCount > 0
          ? roles.findIndex((entry) => entry.uid === 'user')
          : roles.findIndex((entry) => entry.uid === 'admin');

      const user = await User.create({
        email,
        password: hashedPassword,
        username: username,
        role: initialRole,
      });

      const accessToken = jwt.sign({ userId: user.id }, secretKey, {
        expiresIn: '1h',
      });

      user.password = undefined;
      res.status(200).json({ access_token: accessToken, user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Sign up failed');
    }
  });

  return router;
};
