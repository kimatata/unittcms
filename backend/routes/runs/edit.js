import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRun from '../../models/runs';

export default function (sequelize) {
  const Run = defineRun(sequelize, DataTypes);
  const { verifySignedIn } = require('../../middleware/auth')(sequelize);
  const { verifyProjectReporterFromRunId } = require('../../middleware/verifyEditable')(sequelize);

  router.put('/:runId', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.params.runId;
    const updateRun = req.body;
    try {
      const testrun = await Run.findByPk(runId);
      if (!testrun) {
        return res.status(404).send('Run not found');
      }

      delete updateRun.Steps;
      await testrun.update(updateRun);
      res.json(testrun);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
