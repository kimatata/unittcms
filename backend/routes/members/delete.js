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
    const userId = req.query.userId;
    const projectId = req.query.projectId;

    const t = await sequelize.transaction();

    try {
      const deletingMember = await Member.findOne({
        where: { userId, projectId },
        transaction: t,
      });

      if (!deletingMember) {
        await t.rollback();
        return res.status(404).send('Member not found');
      }

      const runs = await Run.findAll({
        where: { projectId },
        attributes: ['id'],
        transaction: t,
      });

      if (runs.length > 0) {
        const runIds = runs.map((r) => r.id);
        await RunCase.update(
          { assigneeUserId: null },
          { where: { runId: runIds, assigneeUserId: userId }, transaction: t }
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
