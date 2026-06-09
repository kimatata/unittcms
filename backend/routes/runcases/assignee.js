import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRunCase from '../../models/runCases.js';
import defineRun from '../../models/runs.js';
import defineMember from '../../models/members.js';
import defineProject from '../../models/projects.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromRunId } = editableMiddleware(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Run = defineRun(sequelize, DataTypes);
  const Member = defineMember(sequelize, DataTypes);
  const Project = defineProject(sequelize, DataTypes);

  router.post('/assignee', verifySignedIn, verifyProjectManagerFromRunId, async (req, res) => {
    const runId = req.query.runId;
    const body = req.body || {};
    const { runCaseIds } = body;

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    if (!Array.isArray(runCaseIds) || runCaseIds.length === 0) {
      return res.status(400).json({ error: 'runCaseIds must be a non-empty array' });
    }

    if (!Object.prototype.hasOwnProperty.call(body, 'assigneeUserId')) {
      return res.status(400).json({ error: 'assigneeUserId is required (use null to clear)' });
    }
    const assigneeUserId = body.assigneeUserId;
    if (assigneeUserId !== null && (!Number.isInteger(assigneeUserId) || assigneeUserId <= 0)) {
      return res.status(400).json({ error: 'assigneeUserId must be a positive integer or null' });
    }

    const t = await sequelize.transaction();

    try {
      const run = await Run.findByPk(runId, { transaction: t });
      if (!run) {
        await t.rollback();
        return res.status(404).json({ error: 'Run not found' });
      }
      const projectId = run.projectId;

      if (assigneeUserId !== null) {
        const [member, project] = await Promise.all([
          Member.findOne({ where: { userId: assigneeUserId, projectId }, transaction: t }),
          Project.findByPk(projectId, { transaction: t }),
        ]);
        const isOwner = project && project.userId === assigneeUserId;
        if (!member && !isOwner) {
          await t.rollback();
          return res.status(400).json({ error: 'assigneeUserId is not a member of this project' });
        }
      }

      const runCases = await RunCase.findAll({
        where: { id: runCaseIds, runId },
        transaction: t,
      });

      if (runCases.length !== runCaseIds.length) {
        await t.rollback();
        return res.status(400).json({ error: 'One or more runCaseIds do not belong to this run' });
      }

      await RunCase.update(
        { assigneeUserId },
        { where: { id: runCaseIds, runId }, transaction: t }
      );

      const updated = await RunCase.findAll({ where: { id: runCaseIds }, transaction: t });

      await t.commit();
      res.json(updated);
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
