import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn, verifyAdmin } = authMiddleware(db);

  router.get('/', verifySignedIn, verifyAdmin, async (req, res) => {
    try {
      const users = await db.repos.users.findAll({
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
