import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsPingRoute from './ping.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => {
      req.userId = 1;
      next();
    }),
  }),
}));

const mockProvider = vi.hoisted(() => ({ verifyConnection: vi.fn() }));
vi.mock('../../services/ciProviders/index.js', () => ({
  getProvider: vi.fn(() => mockProvider),
}));

const validBody = {
  provider: 'github_actions',
  repoOwner: 'org',
  repoName: 'repo',
  accessToken: 'ghp_token',
};

function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize('sqlite::memory:', { logging: false });
  app.use('/ci-configs', ciConfigsPingRoute(sequelize));
  return app;
}

describe('POST /ci-configs/ping', () => {
  let app;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it('returns 200 with ok:true and repoFullName on success', async () => {
    mockProvider.verifyConnection.mockResolvedValue({ repoFullName: 'org/repo' });

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, repoFullName: 'org/repo' });
    expect(mockProvider.verifyConnection).toHaveBeenCalledWith('ghp_token', 'org', 'repo');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/ci-configs/ping').send({ provider: 'github_actions' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 when token is rejected by GitHub', async () => {
    const err = Object.assign(new Error('GitHub authentication failed.'), { statusCode: 401 });
    mockProvider.verifyConnection.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('returns 403 when token lacks permissions', async () => {
    const err = Object.assign(new Error('GitHub access denied.'), { statusCode: 403 });
    mockProvider.verifyConnection.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(403);
  });

  it('returns 404 when repository does not exist', async () => {
    const err = Object.assign(new Error('Not Found'), { statusCode: 404 });
    mockProvider.verifyConnection.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/repository not found/i);
  });

  it('returns 429 when GitHub rate limit is exceeded', async () => {
    const err = Object.assign(new Error('Rate limit exceeded.'), { statusCode: 429 });
    mockProvider.verifyConnection.mockRejectedValue(err);

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(429);
  });

  it('returns 500 on unexpected error', async () => {
    mockProvider.verifyConnection.mockRejectedValue(new Error('Network error'));

    const res = await request(app).post('/ci-configs/ping').send(validBody);

    expect(res.status).toBe(500);
  });
});
