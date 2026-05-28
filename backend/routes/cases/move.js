import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectDeveloperFromProjectId } = editableMiddleware(db);
  const Case = db.repos.cases;

  router.put('/move', verifySignedIn, verifyProjectDeveloperFromProjectId, async (req, res) => {
    const { caseIds, targetFolderId } = req.body;

    if (!Array.isArray(caseIds) || caseIds.length === 0 || !targetFolderId) {
      return res.status(400).json({ error: 'caseIds(array) and targetFolderId are required' });
    }

    try {
      const cases = await Case.findAll({ where: { id: caseIds } });
      if (cases.length !== caseIds.length) {
        return res.status(404).json({ error: 'Some cases not found' });
      }

      await Case.update({ folderId: targetFolderId }, { where: { id: caseIds } });

      res.status(200).json({ message: 'Cases moved successfully', movedCaseIds: caseIds, targetFolderId });
    } catch (error) {
      console.error('Error moving cases:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
