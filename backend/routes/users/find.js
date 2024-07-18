const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.get('/find/:userId', verifySignedIn, async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const user = await User.findByPk(userId, {
          attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
        });
        if (!user) {
          return res.status(404).send('User not found');
        }
        res.json(user);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
