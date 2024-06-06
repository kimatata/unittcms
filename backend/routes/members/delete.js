const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectManagerFromProjectId } = require('../../middleware/verifyEditable')(sequelize);
  const Member = defineMember(sequelize, DataTypes);

  router.delete('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const userId = req.query.userId;
    const projectId = req.query.projectId;

    try {
      // Get Member to be deleted.
      const deletingMember = await Member.findOne({
        where: {
          userId: userId,
          projectId: projectId,
        },
      });

      if (!deletingMember) {
        return res.status(404).send('Member not found');
      }

      await deletingMember.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
