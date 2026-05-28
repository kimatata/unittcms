import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);
  const { verifyProjectReporterFromCommentableId } = editableMiddleware(db);

  router.post('/', verifySignedIn, verifyProjectReporterFromCommentableId, async (req, res) => {
    const { commentableType, commentableId } = req.query;
    const { content } = req.body;

    if (!commentableType || !commentableId || !content) {
      return res.status(400).json({ error: 'commentableType, commentableId, and content are required' });
    }

    try {
      const newComment = await db.repos.comments.create({
        commentableType: commentableType,
        commentableId: commentableId,
        userId: req.userId,
        content: content,
      });

      // Fetch the comment with user data
      const commentWithUser = await db.repos.comments.findByPk(newComment.id, {
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
