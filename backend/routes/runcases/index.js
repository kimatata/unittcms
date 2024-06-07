const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectVisibleFromRunId } = require('../../middleware/verifyVisible')(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.get('/', verifySignedIn, verifyProjectVisibleFromRunId, async (req, res) => {
    const { runId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'run is required' });
    }

    try {
      const runCases = await RunCase.findAll({
        where: {
          runId: runId,
        },
      });
      res.json(runCases);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
