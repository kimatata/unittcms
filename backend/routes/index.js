import express from 'express';
const router = express.Router();

// "/" GET
router.get('/', (req, res) => {
  res.send('This is UnitTCMS API server');
});

module.exports = router;
