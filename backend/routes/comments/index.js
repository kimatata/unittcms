import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import visibilityMiddleware from '../../middleware/verifyVisible.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectVisibleFromCommentableId } = visibilityMiddleware(db);

  router.get('/', verifySignedIn, verifyProjectVisibleFromCommentableId, async (req, res) => {
    const { commentableType, commentableId } = req.query;

    if (!commentableType || !commentableId) {
      return res.status(400).json({ error: 'commentableType and commentableId are required' });
    }

    try {
      const comments = await db.repos.comments.findAll({
        where: {
          commentableType: commentableType,
          commentableId: commentableId,
        },
        include: [
          {
            model: db.repos.users,
            attributes: ['id', 'username', 'email'],
          },
        ],
        order: [['createdAt', 'ASC']],
      });
      res.json(comments);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
