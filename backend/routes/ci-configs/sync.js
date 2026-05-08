import express from 'express';
const router = express.Router();
import { DataTypes, Op } from 'sequelize';
import defineCiRepositoryConfig from '../../models/ciRepositoryConfig.js';
import defineCiPipelineRun from '../../models/ciPipelineRun.js';
import defineCiPipelineJob from '../../models/ciPipelineJob.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { decrypt } from '../../services/crypto.js';
import { getProvider } from '../../services/ciProviders/index.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromCiConfigId } = editableMiddleware(sequelize);

  const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);
  const CiPipelineRun = defineCiPipelineRun(sequelize, DataTypes);
  const CiPipelineJob = defineCiPipelineJob(sequelize, DataTypes);

  router.post('/:configId/sync', verifySignedIn, verifyProjectManagerFromCiConfigId, async (req, res) => {
    const { configId } = req.params;

    try {
      const config = await CiRepositoryConfig.findByPk(configId);
      if (!config) {
        return res.status(404).send('CI configuration not found');
      }

      if (!config.enabled) {
        return res.status(422).json({ error: 'Configuration is disabled.' });
      }

      if (!config.accessToken) {
        return res.status(422).json({ error: 'No access token configured.' });
      }

      let token;
      try {
        token = decrypt(config.accessToken);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server configuration error: SECRET_KEY is required for token decryption' });
      }

      const provider = getProvider(config.provider);
      const since = new Date(Date.now() - THIRTY_DAYS_MS);

      let runs;
      try {
        runs = await provider.listRuns(token, config.repoOwner, config.repoName, since);
      } catch (err) {
        if (err.statusCode === 401) return res.status(401).json({ error: err.message });
        if (err.statusCode === 403) return res.status(403).json({ error: err.message });
        if (err.statusCode === 429) return res.status(429).json({ error: err.message });
        throw err;
      }

      let added = 0;
      let updated = 0;

      for (const runData of runs) {
        const existing = await CiPipelineRun.findOne({
          where: { configId, externalId: runData.externalId },
        });

        let run;
        if (existing) {
          await existing.update({
            name: runData.name,
            status: runData.status,
            conclusion: runData.conclusion,
            providerStatus: runData.providerStatus,
            providerConclusion: runData.providerConclusion,
            branch: runData.branch,
            commitSha: runData.commitSha,
            triggeredBy: runData.triggeredBy,
            startedAt: runData.startedAt,
            completedAt: runData.completedAt,
          });
          run = existing;
          updated++;
        } else {
          run = await CiPipelineRun.create({ configId, ...runData });
          added++;
        }

        let jobs;
        try {
          jobs = await provider.listJobsForRun(token, config.repoOwner, config.repoName, runData.externalId);
        } catch (err) {
          if (err.statusCode === 401) return res.status(401).json({ error: err.message });
          if (err.statusCode === 403) return res.status(403).json({ error: err.message });
          if (err.statusCode === 429) return res.status(429).json({ error: err.message });
          throw err;
        }

        for (const jobData of jobs) {
          const existingJob = await CiPipelineJob.findOne({
            where: { pipelineRunId: run.id, externalId: jobData.externalId },
          });

          if (existingJob) {
            await existingJob.update(jobData);
          } else {
            await CiPipelineJob.create({ pipelineRunId: run.id, ...jobData });
          }
        }
      }

      const removed = await CiPipelineRun.destroy({
        where: {
          configId,
          startedAt: { [Op.lt]: since },
        },
      });

      res.json({ added, updated, removed });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  return router;
}
