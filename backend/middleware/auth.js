import jwt from 'jsonwebtoken';
import { roles, defaultDangerKey } from '../routes/users/authSettings.js';

export default function authMiddleware(db) {
  function verifySignedIn(req, res, next) {
    const authHeader = req.header('Authorization');
    const secretKey = process.env.SECRET_KEY || defaultDangerKey;

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access denied' });
    }

    try {
      const decoded = jwt.verify(token, secretKey);
      req.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  async function verifyAdmin(req, res, next) {
    const user = await db.repos.users.findByPk(req.userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

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
