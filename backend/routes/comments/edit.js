import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.put('/:commentId', verifySignedIn, async (req, res) => {
    const commentId = req.params.commentId;
    const { content } = req.body;

    if (!commentId || !content) {
      return res.status(400).json({ error: 'id and content are required' });
    }

    try {
      const comment = await db.repos.comments.findByPk(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Verify the user owns the comment
      if (comment.userId !== req.userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await comment.update({ content });

      // Fetch the comment with user data
      const commentWithUser = await db.repos.comments.findByPk(commentId, {
        include: [
          {
            model: db.models.User,
            attributes: ['id', 'username', 'email'],
          },
        ],
      });

      res.json(commentWithUser);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
