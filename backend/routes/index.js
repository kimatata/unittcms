const express = require('express');
const router = express.Router();

// "/" GET
router.get('/', (req, res) => {
  res.send('This is the main page!');
});

module.exports = router;
