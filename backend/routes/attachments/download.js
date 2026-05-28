import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function (db) {
  const Attachment = db.repos.attachments;

  // TODO middleware to verify user permission to get attachment
  router.get('/download/:attachmentId', async (req, res) => {
    const attachmentId = req.params.attachmentId;

    try {
      const attachment = await Attachment.findByPk(attachmentId);
      if (!attachment) {
        return res.status(404).send('Attachment not found');
      }

      const filePath = path.join(__dirname, `../../public/uploads/${attachment.filename}`);

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
}
