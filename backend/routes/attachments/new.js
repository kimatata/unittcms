const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const defineAttachment = require('../../models/attachments');
const defineCaseAttachment = require('../../models/caseAttachments');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Attachment = defineAttachment(sequelize, DataTypes);
  const CaseAttachment = defineCaseAttachment(sequelize, DataTypes);

  // Create uploads folder if it does not exist
  const uploadDir = path.join(__dirname, '../../public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: async (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      let fileName = `${baseName}${ext}`;

      // Check if a file with the same name already exists
      let fileExists = true;
      let fileIndex = 1;
      while (fileExists) {
        const filePath = path.join(uploadDir, fileName);
        if (fs.existsSync(filePath)) {
          // If a file with the same name exists, add an index and rename the file
          fileName = `${baseName}_${fileIndex}${ext}`;
          fileIndex++;
        } else {
          fileExists = false;
        }
      }

      cb(null, fileName);
    },
  });

  const upload = multer({ storage });

  router.post('/', upload.array('files', 10), async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const caseId = req.query.parentCaseId;
      const files = req.files;
      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const host = req.get('host');
      const protocol = req.protocol;
      const attachmentsData = files.map((file) => ({
        title: file.originalname,
        path: `${protocol}://${host}/uploads/${file.filename}`,
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
      await t.rollback();
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
