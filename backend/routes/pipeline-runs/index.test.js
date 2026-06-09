import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import pipelineRunsIndexRoute from './index.js';

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
    verifyProjectVisibleFromCiConfigId: vi.fn((req, res, next) => next()),
  }),
}));

const mockRunModel = { findAll: vi.fn() };
vi.mock('../../models/ciPipelineRun.js', () => ({ default: () => mockRunModel }));

describe('GET /pipeline-runs', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/pipeline-runs', pipelineRunsIndexRoute(sequelize));
    vi.clearAllMocks();
  });

  it('returns 400 if configId is missing', async () => {
    const res = await request(app).get('/pipeline-runs');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('configId is required');
  });

  it('returns runs ordered by startedAt DESC', async () => {
    const runs = [
      { id: 2, configId: 1, name: 'CI', status: 'completed' },
      { id: 1, configId: 1, name: 'CI', status: 'completed' },
    ];
    mockRunModel.findAll.mockResolvedValue(runs);

    const res = await request(app).get('/pipeline-runs?configId=1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mockRunModel.findAll).toHaveBeenCalledWith(expect.objectContaining({ order: [['startedAt', 'DESC']] }));
  });

  it('returns empty array when no runs', async () => {
    mockRunModel.findAll.mockResolvedValue([]);
    const res = await request(app).get('/pipeline-runs?configId=1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRunModel.findAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/pipeline-runs?configId=1');
    expect(res.status).toBe(500);
  });
});
