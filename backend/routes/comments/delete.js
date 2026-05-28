import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.delete('/:commentId', verifySignedIn, async (req, res) => {
    const commentId = req.params.commentId;

    if (!commentId) {
      return res.status(400).json({ error: 'commentId is required' });
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

      await comment.destroy();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
