import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(db);
  const RunCase = db.repos.runCases;

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
}
