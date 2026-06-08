import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.post('/', verifySignedIn, async (req, res) => {
    try {
      const { projectId, provider, repoName, automationTool, automationLanguage, repoUrl, repoId } = req.body;

      const existing = await db.repos.automationConfigs.findOne({ where: { projectId } });
      if (existing) {
        return res.status(409).send('Config already exists for this project');
      }

      const data = {
        projectId,
        provider: provider || 'gitlab',
        repoName,
        automationTool,
        automationLanguage,
      };
      if (repoUrl !== undefined) data.repoUrl = repoUrl;
      if (repoId !== undefined) data.repoId = repoId;

      const config = await db.repos.automationConfigs.create(data);

      res.json(config.toJSON());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
