const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const defineAttachment = require('../../models/attachments');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Attachment = defineAttachment(sequelize, DataTypes);
  router.get('/download/:attachmentId', async (req, res) => {
    const attachmentId = req.params.attachmentId;

    try {
      const attachment = await Attachment.findByPk(attachmentId);
      if (!attachment) {
        return res.status(404).send('Attachment not found');
      }

      const filename = attachment.path.split('/').pop();
      const filePath = path.join(__dirname, `../../public/uploads/${filename}`);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.download(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
