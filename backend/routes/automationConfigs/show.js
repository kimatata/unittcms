import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.get('/project/:projectId', verifySignedIn, async (req, res) => {
    try {
      const { projectId } = req.params;
      const config = await db.repos.automationConfigs.findOne({ where: { projectId } });
      if (!config) {
        return res.status(404).send('Not found');
      }
      const data = config.toJSON();
      data.gitlabToken = data.gitlabToken ? '***' : '';
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
