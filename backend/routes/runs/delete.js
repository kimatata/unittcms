import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRun from '../../models/runs.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromRunId } = editableMiddleware(sequelize);
  const Run = defineRun(sequelize, DataTypes);

  router.delete('/:runId', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.params.runId;
    try {
      const testrun = await Run.findByPk(runId);
      if (!testrun) {
        return res.status(404).send('Run not found');
      }
      await testrun.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
