const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyProjectManager } = require('../../middleware/auth')(sequelize);
  const Member = defineMember(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectManager, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;

    try {
      // Check if the record already exists
      const existingMember = await Member.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (existingMember) {
        return res.status(400).send('Record already exists');
      }

      const newMember = await Member.create({
        userId: userId,
        projectId: projectId,
      });

      res.json(newMember);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
