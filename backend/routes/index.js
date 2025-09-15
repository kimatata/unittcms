import express from 'express';
const router = express.Router();

export default function () {
  router.get('/', (req, res) => {
    res.send('This is UnitTCMS API server');
  });
}
