const express = require('express');
const router = express.Router();
const defineUser = require('../../models/users');
const { DataTypes, Op } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const User = defineUser(sequelize, DataTypes);

  router.get('/find', verifySignedIn, async (req, res) => {
    try {
      const { search, excludeIds } = req.query;
      if (!search) {
        return res.status(400).json({ error: 'search text is required' });
      }

      let where = {};
      if (search) {
        where = {
          [Op.or]: [{ email: { [Op.like]: `%${search}%` } }, { username: { [Op.like]: `%${search}%` } }],
        };
      }

      if (excludeIds) {
        const excludeIdArray = excludeIds.split(',').map((id) => parseInt(id, 10));
        where.id = { [Op.notIn]: excludeIdArray };
      }

      const users = await User.findAll({
        where,
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
