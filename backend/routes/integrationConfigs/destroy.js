import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.delete('/:id', verifySignedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const config = await db.repos.integrationConfigs.findByPk(id);
      if (!config) return res.status(404).send('Not found');
      await config.destroy();
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
