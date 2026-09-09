import fs from 'fs';
import path from 'path';
import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAttachment from '../../models/attachments.js';
import defineRunCaseAttachment from '../../models/runCaseAttachments.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { uploadDir } from '../../config/upload.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromRunCaseId } = editableMiddleware(sequelize);
  const Attachment = defineAttachment(sequelize, DataTypes);
  const RunCaseAttachment = defineRunCaseAttachment(sequelize, DataTypes);

  router.delete('/:attachmentId', verifySignedIn, verifyProjectReporterFromRunCaseId, async (req, res) => {
    const attachmentId = req.params.attachmentId;
    const runCaseId = req.query.runCaseId;

    const t = await sequelize.transaction();
    try {
      // Only attachments belonging to this run case may be deleted through this route
      const runCaseAttachment = await RunCaseAttachment.findOne({
        where: { runCaseId: runCaseId, attachmentId: attachmentId },
        transaction: t,
      });
      if (!runCaseAttachment) {
        await t.rollback();
        return res.status(404).send('Attachment not found');
      }

      const attachment = await Attachment.findByPk(attachmentId, { transaction: t });
      if (!attachment) {
        await t.rollback();
        return res.status(404).send('Attachment not found');
      }

      const filename = attachment.filename;
      await runCaseAttachment.destroy({ transaction: t });
      await attachment.destroy({ transaction: t });
      await t.commit();

      // delete file from folder after the records are gone
      fs.unlink(path.join(uploadDir, filename), (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });

      res.status(204).send();
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
