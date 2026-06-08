import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  // GET /:id/test-health — matrix data: folders × recent test runs with pass/fail counts
  router.get('/:id/test-health', verifySignedIn, async (req, res) => {
    try {
      const config = await db.repos.automationConfigs.findByPk(req.params.id);
      if (!config) return res.status(404).send('Config not found');

      const { projectId } = config;

      // Load the last 10 runs for this project
      const runs = await db.repos.runs.findAll({
        where: { projectId },
        order: [['updatedAt', 'DESC']],
        limit: 10,
        raw: true,
        attributes: ['id', 'name', 'state', 'updatedAt'],
      });

      if (runs.length === 0) {
        return res.json({ runs: [], folders: [], matrix: {} });
      }

      const runIds = runs.map((r) => r.id);

      // Load folders for this project
      const folders = await db.repos.folders.findAll({
        where: { projectId, parentFolderId: null },
        raw: true,
        attributes: ['id', 'name'],
      });

      // Load all sub-folders to build full hierarchy
      const allFolders = await db.repos.folders.findAll({
        where: { projectId },
        raw: true,
        attributes: ['id', 'name', 'parentFolderId'],
      });

      const folderById = {};
      for (const f of allFolders) folderById[f.id] = f;

      function getRootFolderId(folderId) {
        let current = folderById[folderId];
        while (current && current.parentFolderId) {
          current = folderById[current.parentFolderId];
        }
        return current?.id ?? folderId;
      }

      // Load cases + runCases for the relevant runs
      const cases = await db.repos.cases.findAll({
        where: { folderId: allFolders.map((f) => f.id) },
        raw: true,
        attributes: ['id', 'folderId'],
      });

      const caseIds = cases.map((c) => c.id);
      const caseToRootFolder = {};
      for (const c of cases) {
        caseToRootFolder[c.id] = getRootFolderId(c.folderId);
      }

      if (caseIds.length === 0) {
        return res.json({ runs, folders, matrix: {} });
      }

      const runCases = await db.repos.runCases.findAll({
        where: { runId: runIds, caseId: caseIds },
        raw: true,
        attributes: ['runId', 'caseId', 'status'],
      });

      // Build matrix: matrix[folderId][runId] = { total, passed, failed, skipped }
      const matrix = {};

      for (const folder of folders) {
        matrix[folder.id] = {};
        for (const run of runs) {
          matrix[folder.id][run.id] = { total: 0, passed: 0, failed: 0, skipped: 0 };
        }
      }

      for (const rc of runCases) {
        const rootFolderId = caseToRootFolder[rc.caseId];
        if (!matrix[rootFolderId]) continue;
        if (!matrix[rootFolderId][rc.runId]) continue;

        const cell = matrix[rootFolderId][rc.runId];
        cell.total++;
        // RunCase status: 1=passed, 2=failed, 3=retest, 4=skipped, 0=untested
        if (rc.status === 1) cell.passed++;
        else if (rc.status === 2) cell.failed++;
        else if (rc.status === 4) cell.skipped++;
      }

      res.json({ runs, folders, matrix });
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message || 'Internal Server Error');
    }
  });

  return router;
}
