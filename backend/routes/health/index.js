const express = require('express');
const router = express.Router();

module.exports = function () {
  router.get('/', async (res) => {
    res.json({ status: 'ok' });
  });

  return router;
};
