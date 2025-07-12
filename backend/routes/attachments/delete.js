const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const defineAttachment = require('../../models/attachments');

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
      const filePath = path.join(uploadDir, attachment.filename);
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
