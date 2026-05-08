import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsNewRoute from './new.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
vi.mock('../../middleware/verifyEditable.js', () => ({
  default: () => ({
    verifyProjectManagerFromProjectId: vi.fn((req, res, next) => next()),
  }),
}));

const mockEncrypt = vi.hoisted(() => vi.fn((text) => `encrypted:${text}`));
vi.mock('../../services/crypto.js', () => ({
  encrypt: mockEncrypt,
}));

const mockConfig = { create: vi.fn() };
vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfig }));

function makeCreatedConfig(overrides = {}) {
  const data = { id: 1, projectId: '5', provider: 'github_actions', repoOwner: 'org', repoName: 'repo', enabled: true, accessToken: 'encrypted:token', createdAt: new Date(), updatedAt: new Date(), ...overrides };
  return { toJSON: () => ({ ...data }) };
}

describe('POST /ci-configs', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ci-configs', ciConfigsNewRoute(sequelize));
    vi.clearAllMocks();
    mockEncrypt.mockImplementation((text) => `encrypted:${text}`);
  });

  it('creates config with token and returns 201 with hasToken: true', async () => {
    mockConfig.create.mockResolvedValue(makeCreatedConfig());
    const res = await request(app)
      .post('/ci-configs?projectId=5')
      .send({ provider: 'github_actions', repoOwner: 'org', repoName: 'repo', accessToken: 'ghp_token' });

    expect(res.status).toBe(201);
    expect(res.body.hasToken).toBe(true);
    expect(res.body.accessToken).toBeUndefined();
    expect(mockEncrypt).toHaveBeenCalledWith('ghp_token');
    expect(mockConfig.create).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'encrypted:ghp_token',
    }));
  });

  it('creates config without token and returns hasToken: false', async () => {
    mockConfig.create.mockResolvedValue(makeCreatedConfig({ accessToken: null }));
    const res = await request(app)
      .post('/ci-configs?projectId=5')
      .send({ provider: 'github_actions', repoOwner: 'org', repoName: 'repo' });

    expect(res.status).toBe(201);
    expect(res.body.hasToken).toBe(false);
    expect(mockEncrypt).not.toHaveBeenCalled();
  });

  it('returns 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/ci-configs?projectId=5')
      .send({ provider: 'github_actions' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('returns 500 with clear message if SECRET_KEY missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockEncrypt.mockImplementation(() => { throw new Error('SECRET_KEY environment variable is required'); });

    const res = await request(app)
      .post('/ci-configs?projectId=5')
      .send({ provider: 'github_actions', repoOwner: 'org', repoName: 'repo', accessToken: 'ghp_token' });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('SECRET_KEY');
  });
});
