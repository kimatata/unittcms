import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/', verifySignedIn, async (req, res) => {
    try {
      const { projectId, provider, repoName, automationTool, automationLanguage } = req.body;

      const existing = await db.repos.automationConfigs.findOne({ where: { projectId } });
      if (existing) {
        return res.status(409).send('Config already exists for this project');
      }

      const config = await db.repos.automationConfigs.create({
        projectId,
        provider: provider || 'gitlab',
        repoName,
        automationTool,
        automationLanguage,
      });

      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
