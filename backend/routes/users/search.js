import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { Op } = db;

  router.get('/search', verifySignedIn, async (req, res) => {
    try {
      const { projectId, search } = req.query;
      if (!projectId || !search) {
        return res.status(400).json({ error: 'projectId and search text are required' });
      }

      let where = {
        [Op.or]: [{ email: { [Op.like]: `%${search}%` } }, { username: { [Op.like]: `%${search}%` } }],
      };

      let excludeIdArray = [];
      const members = await db.repos.members.findAll({
        where: { projectId },
        attributes: ['userId'],
      });
      excludeIdArray = members.map((member) => member.userId);
      excludeIdArray.push(req.userId);
      where.id = { [Op.notIn]: excludeIdArray };

      const users = await db.repos.users.findAll({
        where,
        attributes: ['id', 'email', 'username', 'role', 'avatarPath'],
        limit: 7,
      });
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
