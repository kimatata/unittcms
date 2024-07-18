const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const defineMember = require('../../models/members');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const User = defineUser(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);

  router.get('/search', verifySignedIn, async (req, res) => {
    try {
      const { projectId, search } = req.query;
      if (!projectId || !search) {
        return res.status(400).json({ error: 'projectId and search text are required' });
      }

      let where = {
        [Op.or]: [{ email: { [Op.like]: `%${search}%` } }, { username: { [Op.like]: `%${search}%` } }],
      };

      let excludeIdArray = [];
      const members = await Member.findAll({
        where: { projectId },
        attributes: ['userId'],
      });
      excludeIdArray = members.map((member) => member.userId);
      excludeIdArray.push(req.userId);
      where.id = { [Op.notIn]: excludeIdArray };

      const users = await User.findAll({
        where,
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
        limit: 7,
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
