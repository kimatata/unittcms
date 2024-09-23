const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');
const { roles } = require('./authSettings');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyAdmin } = require('../../middleware/auth')(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.put('/:userId', verifySignedIn, verifyAdmin, async (req, res) => {
    // param check
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const { newRole } = req.body;
    if (!newRole) {
      return res.status(400).json({ error: 'newRole is required' });
    }

    try {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) {
        return res.status(404).send('User not found');
      }

      const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
      const userRoleIndex = roles.findIndex((entry) => entry.uid === 'user');

      // At least one administrator is required.
      if (targetUser.id === adminRoleIndex && newRole === userRoleIndex) {
        const adminCount = await User.count({
          where: {
            role: adminRoleIndex,
          },
        });

        if (adminCount <= 1) {
          return res.status(400).send('At least one administrator is required.');
        }
      }

      await targetUser.update({
        role: newRole,
      });

      res.json({ user: targetUser });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
