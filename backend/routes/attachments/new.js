import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAttachment from '../../models/attachments.js';
import defineCaseAttachment from '../../models/caseAttachments.js';
import { uploadFiles } from '../../config/upload.js';

export default function (sequelize) {
  const Attachment = defineAttachment(sequelize, DataTypes);
  const CaseAttachment = defineCaseAttachment(sequelize, DataTypes);

  // TODO middleware to verify user permission to upload files
  router.post('/', uploadFiles, async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const caseId = req.query.parentCaseId;
      const files = req.files;
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const attachmentsData = files.map((file) => ({
        title: file.originalname,
        filename: file.filename,
      }));

      const newAttachments = await Attachment.bulkCreate(attachmentsData, {
        transaction: t,
      });

      const caseAttachmentsData = newAttachments.map((attachment) => ({
        caseId: caseId,
        attachmentId: attachment.id,
      }));
      await CaseAttachment.bulkCreate(caseAttachmentsData, { transaction: t });
      await t.commit();
      res.json(newAttachments);
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
