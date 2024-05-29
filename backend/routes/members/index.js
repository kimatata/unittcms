const express = require('express');
const router = express.Router();
const defineMember = require('../../models/members');
const defineUser = require('../../models/users');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn, verifyProjectManager } = require('../../middleware/auth')(sequelize);
  const Member = defineMember(sequelize, DataTypes);
  const User = defineUser(sequelize, DataTypes);

  Member.belongsTo(User, { foreignKey: 'userId' });

  router.get('/', verifySignedIn, verifyProjectManager, async (req, res) => {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    try {
      const members = await Member.findAll({
        where: {
          projectId: projectId,
        },
        include: [
          {
            model: User,
          },
        ],
      });
      res.json(members);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
