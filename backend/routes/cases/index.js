const express = require('express');
const router = express.Router();
const { DataTypes, Op } = require('sequelize');
const defineCase = require('../../models/cases');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromFolderId } = require('../../middleware/verifyVisible')(sequelize);

  router.get('/', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { folderId, priority, type, search } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    try {
      const whereClause = {
        folderId: folderId,
      };

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } }
        ];
      }

      if (priority) {
        const priorityValues = priority
          .split(',')
          .map((p) => parseInt(p.trim(), 10))
          .filter((p) => !isNaN(p));
        if (priorityValues.length > 0) {
          whereClause.priority = { [Op.in]: priorityValues };
        }
      }

      if (type) {
        const typeValues = type
          .split(',')
          .map((t) => parseInt(t.trim(), 10))
          .filter((t) => !isNaN(t));
        if (typeValues.length > 0) {
          whereClause.type = { [Op.in]: typeValues };
        }
      }

      const cases = await Case.findAll({
        where: whereClause,
      });
      res.json(cases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
