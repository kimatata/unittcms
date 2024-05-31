const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyProjectManager } = require('../../middleware/auth')(sequelize);
  const Member = defineMember(sequelize, DataTypes);

  router.put('/', verifySignedIn, verifyProjectManager, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;
    const role = req.query.role;

    try {
      const member = await Member.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (!member) {
        return res.status(404).send('Member not found');
      }

      await member.update({
        userId,
        projectId,
        role,
      });
      res.json(member);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
