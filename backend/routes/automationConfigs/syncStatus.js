import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // POST /api/automation-configs/sync-status
  // Body: { projectId, commitSha, cases: [{ caseId, status, filePath, tags? }] }
  // Called by the scanner script in the automation repo after each CI run.
  router.post('/sync-status', verifySignedIn, async (req, res) => {
    try {
      const { projectId, commitSha, cases: incoming } = req.body;
      if (!projectId || !Array.isArray(incoming)) {
        return res.status(400).send('projectId and cases[] are required');
      }

      const parsedProjectId = parseInt(projectId, 10);
      const now = new Date();
      const incomingIds = incoming.map((c) => c.caseId);

      await Promise.all(
        incoming.map(async ({ caseId, status, filePath, tags }) => {
          await db.repos.cases.update(
            {
              codeStatus: status,
              codeFilePath: filePath || null,
              codeLastSyncAt: now,
              codeCommitSha: commitSha || null,
            },
            { where: { id: caseId } }
          );

          // Sync tags when provided (empty array clears tags; undefined skips)
          if (Array.isArray(tags)) {
            const validNames = tags.filter((n) => typeof n === 'string' && n.length >= 3 && n.length <= 20);
            const tagObjects = await Promise.all(
              validNames.map((name) =>
                db.repos.tags.findOrCreate({
                  where: { name, projectId: parsedProjectId },
                  defaults: { name, projectId: parsedProjectId },
                }).then(([tag]) => tag)
              )
            );
            const tagIds = tagObjects.map((t) => t.id);
            await db.repos.caseTags.destroy({ where: { caseId } });
            if (tagIds.length > 0) {
              await db.repos.caseTags.bulkCreate(tagIds.map((tagId) => ({ caseId, tagId })));
            }
          }
        })
      );

      // Mark previously-linked cases not in this sync as stale
      await db.repos.cases.update(
        { codeStatus: 'stale', codeLastSyncAt: now },
        {
          where: {
            codeStatus: { [Op.in]: ['stub', 'implemented'] },
            id: { [Op.notIn]: incomingIds },
            folderId: {
              [Op.in]: db.sequelize.literal(
                `(SELECT "id" FROM "folders" WHERE "projectId" = ${parsedProjectId})`
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
