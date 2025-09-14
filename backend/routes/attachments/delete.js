import fs from 'fs';
import path from 'path';
import express from 'express';
const router = express.Router();
import { DataTypes } from 'sequelize';
import defineAttachment from '../../models/attachments';

export default function (sequelize) {
  const Attachment = defineAttachment(sequelize, DataTypes);

  // TODO middleware to verify user permission to delete attachment
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
}
