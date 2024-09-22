const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');
const { roles } = require('./authSettings');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyAdmin } = require('../../middleware/auth')(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.put('/role/:userId', verifySignedIn, verifyAdmin, async (req, res) => {
    const userId = req.params.userId;
    const newRole = req.query.newRole;

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

      // Trying to downgrade yourself?
      let isSelfDowngrade = false;
      if (req.userId === targetUser.id && newRole === userRoleIndex) {
        isSelfDowngrade = true;
      }

      await targetUser.update({
        role: newRole,
      });

      res.json({ user: targetUser, redirect: isSelfDowngrade });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
