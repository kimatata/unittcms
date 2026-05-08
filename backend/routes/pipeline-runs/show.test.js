import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import pipelineRunsShowRoute from './show.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
vi.mock('../../middleware/verifyVisible.js', () => ({
  default: () => ({
    verifyProjectVisibleFromPipelineRunId: vi.fn((req, res, next) => next()),
  }),
}));

const mockRunModel = { findByPk: vi.fn(), hasMany: vi.fn() };
const mockJobModel = { belongsTo: vi.fn() };
vi.mock('../../models/ciPipelineRun.js', () => ({ default: () => mockRunModel }));
vi.mock('../../models/ciPipelineJob.js', () => ({ default: () => mockJobModel }));

describe('GET /pipeline-runs/:runId', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/pipeline-runs', pipelineRunsShowRoute(sequelize));
    vi.clearAllMocks();
  });

  it('returns run with jobs array', async () => {
    const run = {
      id: 10,
      configId: 1,
      name: 'CI',
      status: 'completed',
      conclusion: 'success',
      jobs: [{ id: 20, name: 'test', status: 'completed' }],
    };
    mockRunModel.findByPk.mockResolvedValue(run);

    const res = await request(app).get('/pipeline-runs/10');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(10);
    expect(res.body.jobs).toHaveLength(1);
    expect(mockRunModel.findByPk).toHaveBeenCalledWith('10', expect.objectContaining({
      include: [expect.objectContaining({ as: 'jobs' })],
    }));
  });

  it('returns 404 if run not found', async () => {
    mockRunModel.findByPk.mockResolvedValue(null);
    const res = await request(app).get('/pipeline-runs/999');
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRunModel.findByPk.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/pipeline-runs/1');
    expect(res.status).toBe(500);
  });
});
