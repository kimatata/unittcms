import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsIndexRoute from './index.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => {
      req.userId = 1;
      next();
    }),
  }),
}));
vi.mock('../../middleware/verifyVisible.js', () => ({
  default: () => ({
    verifyProjectVisibleFromProjectId: vi.fn((req, res, next) => next()),
  }),
}));

const mockConfig = { findAll: vi.fn() };
vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfig }));

function makeConfig(overrides = {}) {
  const data = {
    id: 1,
    projectId: 5,
    provider: 'github_actions',
    repoOwner: 'org',
    repoName: 'repo',
    enabled: true,
    accessToken: 'enc_token',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
  return { toJSON: () => ({ ...data }) };
}

describe('GET /ci-configs', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ci-configs', ciConfigsIndexRoute(sequelize));
    vi.clearAllMocks();
  });

  it('returns 400 if projectId is missing', async () => {
    const res = await request(app).get('/ci-configs');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('projectId is required');
  });

  it('returns configs without accessToken and with hasToken: true', async () => {
    mockConfig.findAll.mockResolvedValue([makeConfig()]);
    const res = await request(app).get('/ci-configs?projectId=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].hasToken).toBe(true);
    expect(res.body[0].accessToken).toBeUndefined();
  });

  it('returns hasToken: false when no token stored', async () => {
    mockConfig.findAll.mockResolvedValue([makeConfig({ accessToken: null })]);
    const res = await request(app).get('/ci-configs?projectId=5');
    expect(res.status).toBe(200);
    expect(res.body[0].hasToken).toBe(false);
  });

  it('returns empty array when no configs', async () => {
    mockConfig.findAll.mockResolvedValue([]);
    const res = await request(app).get('/ci-configs?projectId=5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfig.findAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/ci-configs?projectId=5');
    expect(res.status).toBe(500);
  });
});
