import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

function getFolderPath(folderMap, folderId) {
  const parts = [];
  let current = folderMap[folderId];
  while (current) {
    parts.unshift(current.name);
    current = folderMap[current.parentFolderId ?? null];
  }
  return parts.join(' / ');
}

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /api/automation-configs/:id/implemented-cases
  router.get('/:id/implemented-cases', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const folders = await db.repos.folders.findAll({ where: { projectId: config.projectId }, raw: true });
      const folderMap = Object.fromEntries(folders.map((f) => [f.id, f]));
      const folderIds = folders.map((f) => f.id);

      const [totalCases, implementedObjs] = await Promise.all([
        db.repos.cases.count({ where: { folderId: folderIds } }),
        db.repos.cases.findAll({
          where: { folderId: folderIds, codeStatus: 'implemented' },
          include: [{ model: db.repos.tags, as: 'Tags', through: { attributes: [] } }],
          order: [['id', 'ASC']],
        }),
      ]);

      const cases = implementedObjs.map((c) => ({
        id: c.id,
        title: c.title,
        folderId: c.folderId,
        folderPath: getFolderPath(folderMap, c.folderId),
        tags: (c.Tags || []).map((t) => t.name),
        codeFilePath: c.codeFilePath,
        codeLastSyncAt: c.codeLastSyncAt,
        codeCommitSha: c.codeCommitSha,
      }));

      res.json({ cases, totalCases });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  // GET /api/automation-configs/:id/project-runs
  router.get('/:id/project-runs', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const runs = await db.repos.runs.findAll({
        where: { projectId: config.projectId },
        attributes: ['id', 'name', 'status', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      res.json(runs.map((r) => r.toJSON()));
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
