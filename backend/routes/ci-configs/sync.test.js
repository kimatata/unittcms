import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsSyncRoute from './sync.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
vi.mock('../../middleware/verifyEditable.js', () => ({
  default: () => ({
    verifyProjectManagerFromCiConfigId: vi.fn((req, res, next) => next()),
  }),
}));

const mockDecrypt = vi.hoisted(() => vi.fn(() => 'decrypted_token'));
vi.mock('../../services/crypto.js', () => ({ decrypt: mockDecrypt }));

const mockProvider = vi.hoisted(() => ({
  listRuns: vi.fn(),
  listJobsForRun: vi.fn(),
}));
vi.mock('../../services/ciProviders/index.js', () => ({
  getProvider: vi.fn(() => mockProvider),
}));

const mockConfigModel = { findByPk: vi.fn() };
const mockRunModel = { findOne: vi.fn(), create: vi.fn(), destroy: vi.fn() };
const mockJobModel = { findOne: vi.fn(), create: vi.fn() };

vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfigModel }));
vi.mock('../../models/ciPipelineRun.js', () => ({ default: () => mockRunModel }));
vi.mock('../../models/ciPipelineJob.js', () => ({ default: () => mockJobModel }));

function makeConfig(overrides = {}) {
  return {
    id: 1,
    projectId: 5,
    provider: 'github_actions',
    repoOwner: 'org',
    repoName: 'repo',
    enabled: true,
    accessToken: 'encrypted_token',
    ...overrides,
  };
}

function makeRun(overrides = {}) {
  return {
    externalId: '1001',
    name: 'CI',
    status: 'completed',
    conclusion: 'success',
    providerStatus: 'completed',
    providerConclusion: 'success',
    branch: 'main',
    commitSha: 'abc123',
    triggeredBy: 'user',
    startedAt: new Date('2026-05-01T10:00:00Z'),
    completedAt: new Date('2026-05-01T10:05:00Z'),
    ...overrides,
  };
}

function makeJob(overrides = {}) {
  return {
    externalId: '2001',
    name: 'test',
    status: 'completed',
    conclusion: 'success',
    providerStatus: 'completed',
    providerConclusion: 'success',
    startedAt: new Date('2026-05-01T10:00:00Z'),
    completedAt: new Date('2026-05-01T10:04:00Z'),
    ...overrides,
  };
}

describe('POST /ci-configs/:configId/sync', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ci-configs', ciConfigsSyncRoute(sequelize));
    vi.clearAllMocks();
    mockDecrypt.mockReturnValue('decrypted_token');
  });

  it('returns { added: 1, updated: 0, removed: 0 } for a new run with a new job', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    mockProvider.listRuns.mockResolvedValue([makeRun()]);
    mockRunModel.findOne.mockResolvedValue(null);
    mockRunModel.create.mockResolvedValue({ id: 10 });
    mockProvider.listJobsForRun.mockResolvedValue([makeJob()]);
    mockJobModel.findOne.mockResolvedValue(null);
    mockJobModel.create.mockResolvedValue({ id: 20 });
    mockRunModel.destroy.mockResolvedValue(0);

    const res = await request(app).post('/ci-configs/1/sync');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: 1, updated: 0, removed: 0 });
  });

  it('returns { added: 0, updated: 1, removed: 0 } when run already exists', async () => {
    const existingRun = { id: 10, update: vi.fn() };
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    mockProvider.listRuns.mockResolvedValue([makeRun()]);
    mockRunModel.findOne.mockResolvedValue(existingRun);
    mockProvider.listJobsForRun.mockResolvedValue([]);
    mockRunModel.destroy.mockResolvedValue(0);

    const res = await request(app).post('/ci-configs/1/sync');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ added: 0, updated: 1, removed: 0 });
    expect(existingRun.update).toHaveBeenCalled();
  });

  it('returns removed count from cleanup', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    mockProvider.listRuns.mockResolvedValue([]);
    mockRunModel.destroy.mockResolvedValue(3);

    const res = await request(app).post('/ci-configs/1/sync');

    expect(res.status).toBe(200);
    expect(res.body.removed).toBe(3);
  });

  it('returns 404 if config not found', async () => {
    mockConfigModel.findByPk.mockResolvedValue(null);
    const res = await request(app).post('/ci-configs/999/sync');
    expect(res.status).toBe(404);
  });

  it('returns 422 if config is disabled', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig({ enabled: false }));
    const res = await request(app).post('/ci-configs/1/sync');
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('disabled');
  });

  it('returns 422 if no token configured', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig({ accessToken: null }));
    const res = await request(app).post('/ci-configs/1/sync');
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('token');
  });

  it('returns 401 when GitHub returns 401', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    const err = new Error('GitHub authentication failed. Check the access token.');
    err.statusCode = 401;
    mockProvider.listRuns.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/1/sync');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('authentication failed');
  });

  it('returns 429 when GitHub returns 429', async () => {
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    const err = new Error('GitHub API rate limit exceeded. Try again later.');
    err.statusCode = 429;
    mockProvider.listRuns.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/1/sync');
    expect(res.status).toBe(429);
    expect(res.body.error).toContain('rate limit');
  });

  it('returns 500 if decrypt throws due to missing SECRET_KEY', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfigModel.findByPk.mockResolvedValue(makeConfig());
    mockDecrypt.mockImplementation(() => { throw new Error('SECRET_KEY environment variable is required'); });

    const res = await request(app).post('/ci-configs/1/sync');
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('SECRET_KEY');
  });
});
