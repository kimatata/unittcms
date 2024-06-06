const jwt = require('jsonwebtoken');
const { roles, defaultDangerKey } = require('../routes/users/authSettings');
const { DataTypes } = require('sequelize');
const defineUser = require('../models/users');

function authMiddleware(sequelize) {
  /**
   * Verify user sined in
   *
   * If verification is successful, set userId in req.userId.
   */
  function verifySignedIn(req, res, next) {
    const authHeader = req.header('Authorization');
    const secretKey = process.env.SECRET_KEY || defaultDangerKey;

    const token = authHeader.split(' ')[1]; // delete 'Bearer '
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

  /**
   * Verify user is admin
   * (have to be called after verifySignedIn() middleware)
   */
  async function verifyAdmin(req, res, next) {
    const User = defineUser(sequelize, DataTypes);
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // if project is private, only project owner can access
    const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
    if (user.role !== adminRoleIndex) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  }

  return {
    verifySignedIn,
    verifyAdmin,
  };
}

module.exports = authMiddleware;
