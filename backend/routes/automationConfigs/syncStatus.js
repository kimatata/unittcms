import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineCase from '../../models/cases.js';
import authMiddleware from '../../middleware/auth.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const Case = defineCase(sequelize, DataTypes);

  // POST /api/automation-configs/sync-status
  // Body: { projectId, commitSha, cases: [{ caseId, status, filePath }] }
  // Called by the scanner script in the automation repo after each CI run.
  router.post('/sync-status', verifySignedIn, async (req, res) => {
    try {
      const { projectId, commitSha, cases: incoming } = req.body;
      if (!projectId || !Array.isArray(incoming)) {
        return res.status(400).send('projectId and cases[] are required');
      }

      const now = new Date();
      const incomingIds = incoming.map((c) => c.caseId);

      // Bulk-update cases that appear in the report
      await Promise.all(
        incoming.map(({ caseId, status, filePath }) =>
          Case.update(
            {
              codeStatus: status,
              codeFilePath: filePath || null,
              codeLastSyncAt: now,
              codeCommitSha: commitSha || null,
            },
            { where: { id: caseId } }
          )
        )
      );

      // Mark previously-linked cases not in this sync as stale
      await Case.update(
        { codeStatus: 'stale', codeLastSyncAt: now },
        {
          where: {
            codeStatus: { [Op.in]: ['stub', 'implemented'] },
            id: { [Op.notIn]: incomingIds },
            folderId: {
              [Op.in]: sequelize.literal(
                `(SELECT id FROM folders WHERE projectId = ${parseInt(projectId, 10)})`
              ),
            },
          },
        }
      );

      res.json({ updated: incoming.length });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
