import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const Case = db.repos.cases;
  const Step = db.repos.steps;
  const Tags = db.models.Tags;
  const Attachment = db.repos.attachments;
  const RunCase = db.repos.runCases;

  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromCaseId } = visibilityMiddleware(db);

  router.get('/:caseId', verifySignedIn, verifyProjectVisibleFromCaseId, async (req, res) => {
    const caseId = req.params.caseId;

    if (!caseId) {
      return res.status(400).json({ error: 'caseId is required' });
    }

    try {
      const testcase = await Case.findByPk(caseId, {
        include: [
          {
            model: Step,
            through: { attributes: ['stepNo'] },
          },
          {
            model: Attachment,
          },
          {
            model: Tags,
            attributes: ['id', 'name'],
            through: { attributes: [] },
          },
          {
            model: RunCase,
          },
        ],
      });
      return res.json(testcase);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
