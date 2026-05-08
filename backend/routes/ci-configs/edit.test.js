import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsEditRoute from './edit.js';

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

const mockEncrypt = vi.hoisted(() => vi.fn((text) => `encrypted:${text}`));
vi.mock('../../services/crypto.js', () => ({ encrypt: mockEncrypt }));

const mockConfig = { findByPk: vi.fn() };
vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfig }));

function makeExistingConfig(overrides = {}) {
  const data = { id: 1, projectId: 5, provider: 'github_actions', repoOwner: 'org', repoName: 'repo', enabled: true, accessToken: 'old_encrypted', createdAt: new Date(), updatedAt: new Date(), ...overrides };
  return {
    toJSON: () => ({ ...data }),
    update: vi.fn(async (updates) => { Object.assign(data, updates); }),
  };
}

describe('PUT /ci-configs/:configId', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ci-configs', ciConfigsEditRoute(sequelize));
    vi.clearAllMocks();
    mockEncrypt.mockImplementation((text) => `encrypted:${text}`);
  });

  it('updates repoName and returns 200 with hasToken: true', async () => {
    mockConfig.findByPk.mockResolvedValue(makeExistingConfig());
    const res = await request(app).put('/ci-configs/1').send({ repoName: 'new-repo' });
    expect(res.status).toBe(200);
    expect(res.body.hasToken).toBe(true);
    expect(res.body.accessToken).toBeUndefined();
  });

  it('updates token when accessToken is provided', async () => {
    mockConfig.findByPk.mockResolvedValue(makeExistingConfig());
    const res = await request(app).put('/ci-configs/1').send({ accessToken: 'new_token' });
    expect(res.status).toBe(200);
    expect(mockEncrypt).toHaveBeenCalledWith('new_token');
  });

  it('preserves existing token when accessToken is not in body', async () => {
    mockConfig.findByPk.mockResolvedValue(makeExistingConfig());
    await request(app).put('/ci-configs/1').send({ repoOwner: 'new-org' });
    expect(mockEncrypt).not.toHaveBeenCalled();
  });

  it('returns 404 if config not found', async () => {
    mockConfig.findByPk.mockResolvedValue(null);
    const res = await request(app).put('/ci-configs/999').send({ repoName: 'x' });
    expect(res.status).toBe(404);
  });

  it('returns 500 with clear message if SECRET_KEY missing during token update', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfig.findByPk.mockResolvedValue(makeExistingConfig());
    mockEncrypt.mockImplementation(() => { throw new Error('SECRET_KEY environment variable is required'); });

    const res = await request(app).put('/ci-configs/1').send({ accessToken: 'new_token' });
    expect(res.status).toBe(500);
    expect(res.body.error).toContain('SECRET_KEY');
  });
});
