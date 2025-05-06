const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const Papa = require('papaparse');
const defineCase = require('../../models/cases');

module.exports = function (sequelize) {
  const Case = defineCase(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromFolderId } = require('../../middleware/verifyVisible')(sequelize);

  router.get('/download', verifySignedIn, verifyProjectVisibleFromFolderId, async (req, res) => {
    const { folderId, type } = req.query;

    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }

    if (!type) {
      return res.status(400).json({ error: 'download type is required' });
    }

    try {
      const cases = await Case.findAll({
        where: { folderId },
        raw: true,
      });

      if (cases.length === 0) {
        return res.status(404).send('No cases found');
      }

      if (type === 'json') {
        return res.json(cases);
      } else if (type === 'csv') {
        const csv = Papa.unparse(cases, {
          quotes: true,
          skipEmptyLines: true,
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=cases_folder_${folderId}.csv`);
        return res.send(csv);
      }

      return res.status(400).json({ error: 'Unsupported type. Use ?type=json or ?type=csv' });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
