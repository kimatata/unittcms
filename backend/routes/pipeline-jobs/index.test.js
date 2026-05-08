import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import pipelineJobsIndexRoute from './index.js';

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

const mockJobModel = { findAll: vi.fn() };
vi.mock('../../models/ciPipelineJob.js', () => ({ default: () => mockJobModel }));

describe('GET /pipeline-jobs', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/pipeline-jobs', pipelineJobsIndexRoute(sequelize));
    vi.clearAllMocks();
  });

  it('returns 400 if pipelineRunId is missing', async () => {
    const res = await request(app).get('/pipeline-jobs');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('pipelineRunId is required');
  });

  it('returns jobs ordered by startedAt ASC', async () => {
    const jobs = [
      { id: 1, pipelineRunId: 10, name: 'build', status: 'completed' },
      { id: 2, pipelineRunId: 10, name: 'test', status: 'completed' },
    ];
    mockJobModel.findAll.mockResolvedValue(jobs);

    const res = await request(app).get('/pipeline-jobs?pipelineRunId=10');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(mockJobModel.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ order: [['startedAt', 'ASC']] })
    );
  });

  it('returns empty array when no jobs', async () => {
    mockJobModel.findAll.mockResolvedValue([]);
    const res = await request(app).get('/pipeline-jobs?pipelineRunId=10');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockJobModel.findAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/pipeline-jobs?pipelineRunId=10');
    expect(res.status).toBe(500);
  });
});
