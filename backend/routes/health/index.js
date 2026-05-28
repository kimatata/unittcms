import express from 'express';
const router = express.Router();

export default function (db) {
  router.get('/', async (req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
