import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(db);
  const Case = db.repos.cases;

  router.post('/bulkdelete', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { caseIds } = req.body;
    if (!caseIds || !Array.isArray(caseIds)) {
      return res.status(400).send('Invalid caseIds array');
    }

    try {
      await Case.destroy({ where: { id: caseIds } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
