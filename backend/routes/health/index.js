const express = require('express');
const router = express.Router();

module.exports = function () {
  router.get('/', async (req, res) => {
    res.json({ status: 'ok' });
  });

  return router;
};
