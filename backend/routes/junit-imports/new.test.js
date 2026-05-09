import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';

let allowManager = true;
vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
vi.mock('../../middleware/verifyEditable.js', () => ({
  default: () => ({
    verifyProjectManagerFromProjectId: vi.fn((req, res, next) => {
      if (!allowManager) return res.status(403).json({ error: 'Forbidden' });
      next();
    }),
  }),
}));

const mockRun = { create: vi.fn() };
const mockRunCase = { bulkCreate: vi.fn() };
const mockCase = { findOne: vi.fn(), create: vi.fn() };
const mockFolder = { findOne: vi.fn(), create: vi.fn() };
const mockJunitImport = { create: vi.fn() };
const mockPipelineJob = { findByPk: vi.fn() };
const mockPipelineRun = { findByPk: vi.fn() };
const mockConfig = { findByPk: vi.fn() };

vi.mock('../../models/runs.js', () => ({ default: () => mockRun }));
vi.mock('../../models/runCases.js', () => ({ default: () => mockRunCase }));
vi.mock('../../models/cases.js', () => ({ default: () => mockCase }));
vi.mock('../../models/folders.js', () => ({ default: () => mockFolder }));
vi.mock('../../models/ciJunitImport.js', () => ({ default: () => mockJunitImport }));
vi.mock('../../models/ciPipelineJob.js', () => ({ default: () => mockPipelineJob }));
vi.mock('../../models/ciPipelineRun.js', () => ({ default: () => mockPipelineRun }));
vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfig }));
vi.mock('../../services/junitParser.js', () => ({ parseJUnit: vi.fn() }));
vi.mock('../../services/crypto.js', () => ({ decrypt: vi.fn() }));
vi.mock('../../services/ciProviders/githubActions.js', () => ({ downloadRunArtifacts: vi.fn() }));
vi.mock('adm-zip', () => ({
  default: vi.fn().mockImplementation(() => ({
    getEntries: vi.fn(() => []),
    readAsText: vi.fn(() => ''),
  })),
}));

import junitImportNewRoute from './new.js';
import { parseJUnit } from '../../services/junitParser.js';
import { decrypt } from '../../services/crypto.js';
import { downloadRunArtifacts } from '../../services/ciProviders/githubActions.js';
import AdmZip from 'adm-zip';

const XML_BUFFER = Buffer.from('<testsuite name="Suite"><testcase name="A > B > test one"/></testsuite>');

// Testcase with 3-segment name (Vitest pattern)
const PARSED_VITEST = {
  suiteName: 'Suite',
  testcases: [
    { folder: 'A', subfolder: 'B', title: 'test one', status: 1 },
    { folder: 'A', subfolder: 'B', title: 'test two', status: 2 },
  ],
};

function makeApp(sequelize) {
  const app = express();
  app.use(express.json());
  app.use('/junit-imports', junitImportNewRoute(sequelize));
  return app;
}

function setupSequelize() {
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  sequelize.transaction = vi.fn(async (cb) => cb({}));
  return sequelize;
}

describe('POST /junit-imports — Fluxo A (upload direto)', () => {
  let app, sequelize;

  beforeEach(() => {
    allowManager = true;
    sequelize = setupSequelize();
    app = makeApp(sequelize);
    vi.clearAllMocks();

    parseJUnit.mockReturnValue(PARSED_VITEST);

    // Default: folders and cases don't exist → all created
    mockFolder.findOne.mockResolvedValue(null);
    mockFolder.create.mockResolvedValue({ id: 10 });
    mockCase.findOne.mockResolvedValue(null);
    mockCase.create.mockResolvedValue({ id: 43 });
    mockRun.create.mockResolvedValue({ id: 99 });
    mockRunCase.bulkCreate.mockResolvedValue([]);
    mockJunitImport.create.mockResolvedValue({});
  });

  it('returns 201 with matched + created counts', async () => {
    // first case exists (matched), second is new (created)
    mockCase.findOne
      .mockResolvedValueOnce({ id: 42 })
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ runId: 99, matched: 1, created: 1, skipped: 0, total: 2 });
  });

  it('creates folder and sub-folder when they do not exist', async () => {
    mockFolder.create
      .mockResolvedValueOnce({ id: 10 }) // root folder A
      .mockResolvedValueOnce({ id: 11 }); // sub-folder B

    await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(mockFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', parentFolderId: null }),
      expect.anything()
    );
    expect(mockFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'B', parentFolderId: 10 }),
      expect.anything()
    );
  });

  it('reuses existing folder and cases (all matched)', async () => {
    mockFolder.findOne.mockResolvedValue({ id: 10 });
    mockCase.findOne.mockResolvedValue({ id: 42 });

    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(res.status).toBe(201);
    expect(mockFolder.create).not.toHaveBeenCalled();
    expect(mockCase.create).not.toHaveBeenCalled();
    expect(res.body.matched).toBe(2);
    expect(res.body.created).toBe(0);
  });

  it('creates CI Imports folder for testcase without separator', async () => {
    parseJUnit.mockReturnValue({
      suiteName: 'S',
      testcases: [{ folder: null, subfolder: null, title: 'plain test', status: 1 }],
    });

    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(mockFolder.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'CI Imports', parentFolderId: null }),
      expect.anything()
    );
    expect(res.status).toBe(201);
  });

  it('returns 201 with all created when no existing cases', async () => {
    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(res.body).toMatchObject({ matched: 0, created: 2, total: 2 });
  });

  it('returns 400 for invalid XML', async () => {
    parseJUnit.mockImplementation(() => { throw new Error('Invalid JUnit XML format'); });

    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', Buffer.from('not xml'), { filename: 'bad.xml', contentType: 'text/xml' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid JUnit XML format');
  });

  it('returns 400 when both file and pipelineJobId are provided', async () => {
    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .field('pipelineJobId', '7')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when neither file nor pipelineJobId provided', async () => {
    const res = await request(app).post('/junit-imports?projectId=5').send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 when manager middleware rejects', async () => {
    allowManager = false;
    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .attach('file', XML_BUFFER, { filename: 'results.xml', contentType: 'text/xml' });

    expect(res.status).toBe(403);
  });
});

describe('POST /junit-imports — Fluxo B (via pipeline job)', () => {
  let app, sequelize;

  beforeEach(() => {
    allowManager = true;
    sequelize = setupSequelize();
    app = makeApp(sequelize);
    vi.clearAllMocks();

    mockPipelineJob.findByPk.mockResolvedValue({ id: 7, pipelineRunId: 3 });
    mockPipelineRun.findByPk.mockResolvedValue({ id: 3, configId: 1, externalId: '9999', name: 'CI' });
    mockConfig.findByPk.mockResolvedValue({ id: 1, projectId: 5, repoOwner: 'org', repoName: 'repo', accessToken: 'enc' });
    decrypt.mockReturnValue('ghp_token');
    downloadRunArtifacts.mockResolvedValue([Buffer.from('fake-zip')]);

    AdmZip.mockImplementation(() => ({
      getEntries: () => [{ entryName: 'results.xml', isDirectory: false }],
      readAsText: () => '<testsuite name="CI"><testcase name="Suite > sub > test_b"/></testsuite>',
    }));

    parseJUnit.mockReturnValue({
      suiteName: 'CI',
      testcases: [{ folder: 'Suite', subfolder: 'sub', title: 'test_b', status: 1 }],
    });

    mockFolder.findOne.mockResolvedValue(null);
    mockFolder.create
      .mockResolvedValueOnce({ id: 20 })
      .mockResolvedValueOnce({ id: 21 });
    mockCase.findOne.mockResolvedValue(null);
    mockCase.create.mockResolvedValue({ id: 55 });
    mockRun.create.mockResolvedValue({ id: 100 });
    mockRunCase.bulkCreate.mockResolvedValue([]);
    mockJunitImport.create.mockResolvedValue({});
  });

  it('returns 201 with created count on successful pipeline import', async () => {
    const res = await request(app)
      .post('/junit-imports?projectId=5')
      .send({ pipelineJobId: '7' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ runId: 100, matched: 0, created: 1, total: 1 });
    expect(mockRun.create).toHaveBeenCalledWith(
      expect.objectContaining({ pipelineRunId: 3 }),
      expect.anything()
    );
    expect(mockJunitImport.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'pipeline_job', pipelineJobId: '7' }),
      expect.anything()
    );
  });

  it('returns 404 when pipelineJobId not found', async () => {
    mockPipelineJob.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '999' });
    expect(res.status).toBe(404);
  });

  it('returns 403 when job belongs to a different project', async () => {
    mockConfig.findByPk.mockResolvedValue({ id: 1, projectId: 99, repoOwner: 'org', repoName: 'repo', accessToken: 'enc' });
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '7' });
    expect(res.status).toBe(403);
  });

  it('returns 422 when no artifacts found', async () => {
    downloadRunArtifacts.mockResolvedValue([]);
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '7' });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('No artifacts found');
  });

  it('returns 422 when no XML files in artifact', async () => {
    AdmZip.mockImplementation(() => ({
      getEntries: () => [{ entryName: 'report.json', isDirectory: false }],
      readAsText: () => '{}',
    }));
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '7' });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('No XML files found');
  });

  it('returns 401 when GitHub token is invalid', async () => {
    const err = new Error('GitHub authentication failed. Check the access token.');
    err.statusCode = 401;
    downloadRunArtifacts.mockRejectedValue(err);
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '7' });
    expect(res.status).toBe(401);
  });

  it('returns 429 on GitHub rate limit', async () => {
    const err = new Error('GitHub API rate limit exceeded. Try again later.');
    err.statusCode = 429;
    downloadRunArtifacts.mockRejectedValue(err);
    const res = await request(app).post('/junit-imports?projectId=5').send({ pipelineJobId: '7' });
    expect(res.status).toBe(429);
  });
});
