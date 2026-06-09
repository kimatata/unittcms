import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineMember from '../../models/members.js';
import defineRunCase from '../../models/runCases.js';
import defineRun from '../../models/runs.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);
  const Member = defineMember(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Run = defineRun(sequelize, DataTypes);

  router.delete('/', verifySignedIn, verifyProjectManagerFromProjectId, async (req, res) => {
    const userIdNum = Number(req.query.userId);
    const projectIdNum = Number(req.query.projectId);

    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!Number.isInteger(projectIdNum) || projectIdNum <= 0) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const t = await sequelize.transaction();

    try {
      const deletingMember = await Member.findOne({
        where: { userId: userIdNum, projectId: projectIdNum },
        transaction: t,
      });

      if (!deletingMember) {
        await t.rollback();
        return res.status(404).send('Member not found');
      }

      const runs = await Run.findAll({
        where: { projectId: projectIdNum },
        attributes: ['id'],
        transaction: t,
      });

      if (runs.length > 0) {
        const runIds = runs.map((r) => r.id);
        await RunCase.update(
          { assigneeUserId: null },
          { where: { runId: runIds, assigneeUserId: userIdNum }, transaction: t }
        );
      }

      await deletingMember.destroy({ transaction: t });
      await t.commit();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
