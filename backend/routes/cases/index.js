const express = require('express');
const router = express.Router();
const defineCase = require('../../models/cases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromFolderId } = require('../../middleware/verifyVisible')(sequelize);

  router.get('/', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { folderId } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    try {
      const cases = await Case.findAll({
        where: {
          folderId: folderId,
        },
      });
      res.json(cases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
