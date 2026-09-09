import fs from 'fs';
import path from 'path';
import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAttachment from '../../models/attachments.js';
import defineRunCaseAttachment from '../../models/runCaseAttachments.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { uploadFiles, uploadDir } from '../../config/upload.js';

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectReporterFromRunCaseId } = editableMiddleware(sequelize);
  const Attachment = defineAttachment(sequelize, DataTypes);
  const RunCaseAttachment = defineRunCaseAttachment(sequelize, DataTypes);

  // Remove files that were already written to disk when the transaction failed
  function removeUploadedFiles(files) {
    (files || []).forEach((file) => {
      fs.unlink(path.join(uploadDir, file.filename), (err) => {
        if (err) {
          console.error('Error deleting file:', err);
        }
      });
    });
  }

  router.post('/', verifySignedIn, verifyProjectReporterFromRunCaseId, uploadFiles, async (req, res) => {
    const runCaseId = req.query.runCaseId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const t = await sequelize.transaction();
    try {
      const attachmentsData = files.map((file) => ({
        title: file.originalname,
        filename: file.filename,
      }));

      const newAttachments = await Attachment.bulkCreate(attachmentsData, {
        transaction: t,
      });

      const runCaseAttachmentsData = newAttachments.map((attachment) => ({
        runCaseId: runCaseId,
        attachmentId: attachment.id,
      }));
      await RunCaseAttachment.bulkCreate(runCaseAttachmentsData, { transaction: t });

      await t.commit();
      res.json(newAttachments);
    } catch (error) {
      console.error(error);
      await t.rollback();
      removeUploadedFiles(files);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
