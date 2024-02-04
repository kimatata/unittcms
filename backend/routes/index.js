const express = require('express');
const router = express.Router();

// "/" GET
router.get('/', (req, res) => {
  res.send('Test Case Management API Server');
});

module.exports = router;
