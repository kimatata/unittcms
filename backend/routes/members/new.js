const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const { DataTypes } = require('sequelize');
const { memberRoles } = require('../../routes/users/authSettings');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectManagerFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
  const Member = defineMember(sequelize, DataTypes);

  router.post('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
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

      const managerRoleIndex = memberRoles.findIndex((entry) => entry.uid === 'reporter');
      const newMember = await Member.create({
        userId: userId,
        projectId: projectId,
        role: managerRoleIndex,
      });

      res.json(newMember);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
