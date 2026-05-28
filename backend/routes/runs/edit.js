import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectReporterFromRunId } = editableMiddleware(db);

  router.put('/:runId', verifySignedIn, verifyProjectReporterFromRunId, async (req, res) => {
    const runId = req.params.runId;
    const updateRun = req.body;
    try {
      const testrun = await db.repos.runs.findByPk(runId);
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
