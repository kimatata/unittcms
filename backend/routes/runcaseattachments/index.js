import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineRunCase from '../../models/runCases.js';
import defineAttachment from '../../models/attachments.js';
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectVisibleFromRunCaseId } = visibilityMiddleware(sequelize);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const Attachment = defineAttachment(sequelize, DataTypes);
  RunCase.belongsToMany(Attachment, {
    through: 'runCaseAttachments',
    foreignKey: 'runCaseId',
    otherKey: 'attachmentId',
  });
  Attachment.belongsToMany(RunCase, {
    through: 'runCaseAttachments',
    foreignKey: 'attachmentId',
    otherKey: 'runCaseId',
  });

  router.get('/', verifySignedIn, verifyProjectVisibleFromRunCaseId, async (req, res) => {
    const runCaseId = req.query.runCaseId;

    if (!runCaseId) {
      return res.status(400).json({ error: 'runCaseId is required' });
    }

    try {
      const runCase = await RunCase.findByPk(runCaseId, {
        include: [{ model: Attachment }],
      });

      if (!runCase) {
        return res.status(404).json({ error: 'RunCase not found' });
      }

      res.json(runCase.Attachments || []);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
