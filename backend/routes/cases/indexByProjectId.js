import express from 'express';
const router = express.Router();
import { Op } from 'sequelize';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const Case = db.repos.cases;
  const RunCase = db.repos.runCases;
  const Tags = db.models.Tags;
  const Folder = db.repos.folders;
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromProjectId } = visibilityMiddleware(db);
  const { verifyProjectVisibleFromRunId } = visibilityMiddleware(db);

  router.get(
    '/byproject',
    verifySignedIn,
    verifyProjectVisibleFromProjectId,
    verifyProjectVisibleFromRunId,
    async (req, res) => {
      const { projectId, runId, status, tag, search } = req.query;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      if (!runId) {
        return res.status(400).json({ error: 'runId is required' });
      }

      try {
        // Build where clause for Case model
        const caseWhereClause = {};

        // Handle search parameter
        if (search) {
          const searchTerm = search.trim();

          if (searchTerm.length > 100) {
            return res.status(400).json({ error: 'too long search param' });
          }

          if (searchTerm.length >= 1) {
            caseWhereClause[Op.or] = [
              { title: { [Op.like]: `%${searchTerm}%` } },
              { description: { [Op.like]: `%${searchTerm}%` } },
            ];
          }
        }

        // Handle status filter for RunCase
        let statusFilter = undefined;
        let runCaseRequired = false;
        if (status) {
          const statusValues = status
            .split(',')
            .map((t) => parseInt(t.trim(), 10))
            .filter((t) => !isNaN(t));

          if (statusValues.length > 0) {
            statusFilter = { status: { [Op.in]: statusValues } };
            runCaseRequired = true;
          }
        }

        // Handle tag filter
        const tagInclude = {
          model: Tags,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        };

        if (tag) {
          const tagIds = tag
            .split(',')
            .map((t) => parseInt(t.trim(), 10))
            .filter((t) => !isNaN(t));

          if (tagIds.length > 0) {
            tagInclude.where = { id: { [Op.in]: tagIds } };
            tagInclude.required = true;
          }
        }

        const cases = await Case.findAll({
          where: caseWhereClause,
          include: [
            {
              model: Folder,
              where: {
                projectId: projectId,
              },
              attributes: [],
            },
            {
              model: RunCase,
              attributes: [
                'id',
                'runId',
                'status',
                [
                  db.sequelize.literal(
                    '(SELECT COUNT(*) FROM "comments" WHERE "comments"."commentableType" = ' +
                      db.sequelize.escape('RunCase') +
                      ' AND "comments"."commentableId" = "RunCases"."id")'
                  ),
                  'commentCount',
                ],
              ],
              // Must be 'true' when filtering by status, otherwise all cases are returned.
              required: runCaseRequired,
              where: {
                [Op.and]: [{ runId: runId }, statusFilter],
              },
            },
            tagInclude,
          ],
        });
        res.json(cases);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    }
  );

  return router;
}
