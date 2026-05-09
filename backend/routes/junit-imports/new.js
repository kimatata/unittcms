import path from 'path';
import express from 'express';
const router = express.Router();
import multer from 'multer';
import { DataTypes } from 'sequelize';
import AdmZip from 'adm-zip';
import defineRun from '../../models/runs.js';
import defineRunCase from '../../models/runCases.js';
import defineCase from '../../models/cases.js';
import defineFolder from '../../models/folders.js';
import defineCiJunitImport from '../../models/ciJunitImport.js';
import defineCiPipelineJob from '../../models/ciPipelineJob.js';
import defineCiPipelineRun from '../../models/ciPipelineRun.js';
import defineCiRepositoryConfig from '../../models/ciRepositoryConfig.js';
import authMiddleware from '../../middleware/auth.js';
import editableMiddleware from '../../middleware/verifyEditable.js';
import { parseJUnit } from '../../services/junitParser.js';
import { decrypt } from '../../services/crypto.js';
import { downloadRunArtifacts } from '../../services/ciProviders/githubActions.js';

const CASE_DEFAULTS = {
  state: 0,
  priority: 2,
  type: 0,
  automationStatus: 1,
  template: 0,
  description: null,
  preConditions: null,
  expectedResults: null,
};

const ALLOWED_MIMETYPES = new Set(['text/xml', 'application/xml', 'text/plain']);

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xml' || ALLOWED_MIMETYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

function extractXmlFromZips(buffers) {
  const xmlStrings = [];
  for (const buf of buffers) {
    const zip = new AdmZip(buf);
    for (const entry of zip.getEntries()) {
      if (entry.entryName.toLowerCase().endsWith('.xml') && !entry.isDirectory) {
        xmlStrings.push(zip.readAsText(entry));
      }
    }
  }
  return xmlStrings;
}

function mergeTestcases(parsedResults) {
  // key: "folder::subfolder::title" — last result wins
  const seen = new Map();
  for (const { testcases } of parsedResults) {
    for (const tc of testcases) {
      const key = `${tc.folder ?? ''}::${tc.subfolder ?? ''}::${tc.title}`;
      seen.set(key, tc);
    }
  }
  return Array.from(seen.values());
}

async function getOrCreateFolder(Folder, projectId, name, parentFolderId, cache, transaction) {
  const cacheKey = `${parentFolderId ?? 'root'}::${name}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let folder = await Folder.findOne({
    where: { name, projectId, parentFolderId: parentFolderId ?? null },
    transaction,
  });
  if (!folder) {
    folder = await Folder.create({ name, projectId, parentFolderId: parentFolderId ?? null }, { transaction });
  }
  cache.set(cacheKey, folder.id);
  return folder.id;
}

async function processTestcases(sequelize, projectId, testcases, transaction) {
  const Folder = defineFolder(sequelize, DataTypes);
  const Case = defineCase(sequelize, DataTypes);

  const folderCache = new Map();
  const runCases = [];
  let matched = 0;
  let created = 0;
  let skipped = 0;

  for (const tc of testcases) {
    if (!tc.title) {
      skipped++;
      continue;
    }

    // Resolve target folderId
    let folderId;
    if (!tc.folder) {
      folderId = await getOrCreateFolder(Folder, projectId, 'CI Imports', null, folderCache, transaction);
    } else {
      const rootId = await getOrCreateFolder(Folder, projectId, tc.folder, null, folderCache, transaction);
      if (tc.subfolder) {
        folderId = await getOrCreateFolder(Folder, projectId, tc.subfolder, rootId, folderCache, transaction);
      } else {
        folderId = rootId;
      }
    }

    // Find or create the case in the target folder
    let caseRecord = await Case.findOne({ where: { title: tc.title, folderId }, transaction });
    if (caseRecord) {
      matched++;
    } else {
      caseRecord = await Case.create({ ...CASE_DEFAULTS, title: tc.title, folderId }, { transaction });
      created++;
    }

    runCases.push({ caseId: caseRecord.id, status: tc.status });
  }

  return { runCases, matched, created, skipped };
}

async function buildAndSaveImport(
  sequelize,
  { projectId, suiteName, testcases, pipelineRunId, pipelineJobId, source }
) {
  const Run = defineRun(sequelize, DataTypes);
  const RunCase = defineRunCase(sequelize, DataTypes);
  const CiJunitImport = defineCiJunitImport(sequelize, DataTypes);

  return sequelize.transaction(async (t) => {
    const run = await Run.create(
      { name: suiteName, projectId, state: 0, pipelineRunId: pipelineRunId ?? null },
      { transaction: t }
    );

    const { runCases, matched, created, skipped } = await processTestcases(sequelize, projectId, testcases, t);

    const total = testcases.length;

    if (runCases.length > 0) {
      await RunCase.bulkCreate(
        runCases.map((rc) => ({ runId: run.id, caseId: rc.caseId, status: rc.status })),
        { transaction: t }
      );
    }

    await CiJunitImport.create(
      { runId: run.id, projectId, source, pipelineJobId: pipelineJobId ?? null, matched, created, skipped, total },
      { transaction: t }
    );

    return { runId: run.id, matched, created, skipped, total };
  });
}

export default function (sequelize) {
  const { verifySignedIn } = authMiddleware(sequelize);
  const { verifyProjectManagerFromProjectId } = editableMiddleware(sequelize);

  router.post(
    '/',
    (req, res, next) => {
      upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
      });
    },
    verifySignedIn,
    verifyProjectManagerFromProjectId,
    async (req, res) => {
      const projectId = req.query.projectId;
      const hasFile = !!req.file;
      const { pipelineJobId } = req.body;

      if (hasFile && pipelineJobId) {
        return res.status(400).json({ error: 'Provide either file or pipelineJobId, not both' });
      }
      if (!hasFile && !pipelineJobId) {
        return res.status(400).json({ error: 'Provide either file or pipelineJobId' });
      }

      try {
        // Flow A: upload direto
        if (hasFile) {
          let parsed;
          try {
            parsed = parseJUnit(req.file.buffer.toString());
          } catch {
            return res.status(400).json({ error: 'Invalid JUnit XML format' });
          }

          const result = await buildAndSaveImport(sequelize, {
            projectId,
            suiteName: parsed.suiteName,
            testcases: parsed.testcases,
            pipelineRunId: null,
            pipelineJobId: null,
            source: 'upload',
          });

          return res.status(201).json(result);
        }

        // Flow B: via pipeline work
        const CiPipelineJob = defineCiPipelineJob(sequelize, DataTypes);
        const CiPipelineRun = defineCiPipelineRun(sequelize, DataTypes);
        const CiRepositoryConfig = defineCiRepositoryConfig(sequelize, DataTypes);

        const job = await CiPipelineJob.findByPk(pipelineJobId);
        if (!job) return res.status(404).send();

        const pipelineRun = await CiPipelineRun.findByPk(job.pipelineRunId);
        const config = await CiRepositoryConfig.findByPk(pipelineRun.configId);

        if (String(config.projectId) !== String(projectId)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const token = decrypt(config.accessToken);
        let zipBuffers;
        try {
          zipBuffers = await downloadRunArtifacts(token, config.repoOwner, config.repoName, pipelineRun.externalId);
        } catch (err) {
          if (err.statusCode === 401) return res.status(401).json({ error: err.message });
          if (err.statusCode === 429) return res.status(429).json({ error: err.message });
          throw err;
        }

        if (zipBuffers.length === 0) {
          return res.status(422).json({ error: 'No artifacts found for this pipeline job' });
        }

        const xmlStrings = extractXmlFromZips(zipBuffers);
        if (xmlStrings.length === 0) {
          return res.status(422).json({ error: 'No XML files found in the artifact' });
        }

        const parsedResults = [];
        for (const xmlStr of xmlStrings) {
          try {
            parsedResults.push(parseJUnit(xmlStr));
          } catch {
            /* skip invalid */
          }
        }

        if (parsedResults.length === 0) {
          return res.status(400).json({ error: 'Invalid JUnit XML format' });
        }

        const testcases = mergeTestcases(parsedResults);
        const suiteName = parsedResults[0].suiteName;

        const result = await buildAndSaveImport(sequelize, {
          projectId,
          suiteName,
          testcases,
          pipelineRunId: pipelineRun.id,
          pipelineJobId,
          source: 'pipeline_job',
        });

        return res.status(201).json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    }
  );

  return router;
}
