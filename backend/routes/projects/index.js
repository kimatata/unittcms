const express = require('express');
const router = express.Router();

// "/projects" GET
router.get('/', (req, res) => {
  res.send('This is the projects page!');
});

module.exports = router;
