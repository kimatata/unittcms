const jwt = require('jsonwebtoken');
const { defaultDangerKey } = require('../routes/auth/authSettings');

function verifySinedIn(req, res, next) {
  const token = req.header('Authorization');
  const secretKey = process.env.SECRET_KEY || defaultDangerKey;

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifySinedIn };
