const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const defineAttachment = require('../../models/attachments');
const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  const Attachment = defineAttachment(sequelize, DataTypes);

  router.delete('/:attachmentId', async (req, res) => {
    const attachmentId = req.params.attachmentId;
    const t = await sequelize.transaction();

    try {
      const attachment = await Attachment.findByPk(attachmentId);
      if (!attachment) {
        await t.rollback();
        return res.status(404).send('Attachment not found');
      }

      // delete file from folder
      const uploadDir = path.join(__dirname, '../../public/uploads');
      const url = attachment.path;
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      const filePath = path.join(uploadDir, fileName);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          t.rollback();
          return res.status(404).send('Attachment not found');
        }
      });

      await attachment.destroy({ transaction: t });
      await t.commit();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      await t.rollback();
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
};
