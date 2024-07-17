const express = require('express');
const router = express.Router();
const defineRunCase = require('../../models/runCases');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);

  router.post('/update', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.query.runId;
    const runCases = req.body;
    const t = await sequelize.transaction();

    const createRunCase = async (runCase) => {
      const newRunCase = await RunCase.create(
        {
          runId: runId,
          caseId: runCase.caseId,
          status: runCase.status,
        },
        { transaction: t }
      );
      return newRunCase;
    };

    const deleteRunCase = async (runCase) => {
      await RunCase.destroy({
        where: { runId: runId, caseId: runCase.caseId },
        transaction: t,
      });
      return null;
    };

    const updateRunCase = async (runCase) => {
      await RunCase.update(
        {
          status: runCase.status,
        },
        {
          where: { id: runCase.id },
          transaction: t,
        }
      );
      return runCase;
    };

    try {
      const results = await Promise.all(
        runCases.map(async (step) => {
          if (step.editState === 'new') {
            return createRunCase(step);
          } else if (step.editState === 'deleted') {
            return deleteRunCase(step);
          } else if (step.editState === 'changed') {
            return updateRunCase(step);
          } else if (step.editState === 'notChanged') {
            return step;
          }
        })
      );

      await t.commit();
      res.json(results.filter((result) => result !== null));
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
