import express from 'express';
const router = express.Router();
import authMiddleware from '../../middleware/auth.js';

export default function (db) {
  const { verifySignedIn } = authMiddleware(db);

  router.get('/list-repos', verifySignedIn, async (req, res) => {
    try {
      const { projectId, service } = req.query;
      if (!projectId || !service) {
        return res.status(400).json({ error: 'projectId and service are required' });
      }

      const integration = await db.repos.integrationConfigs.findOne({
        where: { projectId: Number(projectId), service },
      });

      if (!integration) {
        return res.status(404).json({ error: `No ${service} integration configured` });
      }

      const token = integration.apiKey;
      const instanceUrl =
        integration.settings?.instanceUrl ||
        (service === 'github' ? 'https://github.com' : 'https://gitlab.com');

      const apiBase =
        service === 'github'
          ? instanceUrl.includes('github.com')
            ? 'https://api.github.com'
            : `${instanceUrl}/api/v3`
          : `${instanceUrl}/api/v4`;

      const repos = [];

      if (service === 'github') {
        let page = 1;
        let fetched;
        do {
          const r = await fetch(
            `${apiBase}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );
          if (!r.ok) {
            const text = await r.text();
            return res.status(r.status).json({ error: text });
          }
          fetched = await r.json();
          for (const repo of fetched) {
            repos.push({
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              url: repo.html_url,
              isPrivate: repo.private,
              description: repo.description || null,
            });
          }
          page++;
        } while (fetched.length === 100 && page <= 5);
      } else {
        let page = 1;
        let fetched;
        do {
          const r = await fetch(
            `${apiBase}/projects?membership=true&per_page=100&order_by=last_activity_at&page=${page}`,
            { headers: { 'PRIVATE-TOKEN': token } }
          );
          if (!r.ok) {
            const text = await r.text();
            return res.status(r.status).json({ error: text });
          }
          fetched = await r.json();
          for (const project of fetched) {
            repos.push({
              id: project.id,
              name: project.name,
              fullName: project.path_with_namespace,
              url: project.web_url,
              isPrivate: project.visibility !== 'public',
              description: project.description || null,
            });
          }
          page++;
        } while (fetched.length === 100 && page <= 5);
      }

      res.json(repos);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
