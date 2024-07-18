const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyAdmin } = require('../../middleware/auth')(sequelize);
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
};
