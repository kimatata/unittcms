import express from 'express';
const router = express.Router();

export default function () {
  router.get('/', async (req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
}
