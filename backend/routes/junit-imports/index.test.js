import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import junitImportsIndexRoute from './index.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
let allowVisible = true;
vi.mock('../../middleware/verifyVisible.js', () => ({
  default: () => ({
    verifyProjectVisibleFromProjectId: vi.fn((req, res, next) => {
      if (!allowVisible) return res.status(403).json({ error: 'Forbidden' });
      next();
    }),
  }),
}));

const mockImport = { findAll: vi.fn() };
vi.mock('../../models/ciJunitImport.js', () => ({ default: () => mockImport }));

const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

describe('GET /junit-imports', () => {
  let app;

  beforeEach(() => {
    allowVisible = true;
    app = express();
    app.use(express.json());
    app.use('/junit-imports', junitImportsIndexRoute(sequelize));
    vi.clearAllMocks();
  });

  it('returns 400 if projectId is missing', async () => {
    const res = await request(app).get('/junit-imports');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('projectId is required');
  });

  it('returns list of imports ordered by createdAt DESC', async () => {
    const rows = [
      { id: 2, runId: 10, projectId: 5, source: 'upload', pipelineJobId: null, matched: 3, skipped: 1, total: 4, createdAt: '2026-05-09T11:00:00Z', updatedAt: '2026-05-09T11:00:00Z' },
      { id: 1, runId: 9, projectId: 5, source: 'pipeline_job', pipelineJobId: 7, matched: 5, skipped: 0, total: 5, createdAt: '2026-05-09T10:00:00Z', updatedAt: '2026-05-09T10:00:00Z' },
    ];
    mockImport.findAll.mockResolvedValue(rows);

    const res = await request(app).get('/junit-imports?projectId=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe(2);
  });

  it('returns empty array when no imports', async () => {
    mockImport.findAll.mockResolvedValue([]);
    const res = await request(app).get('/junit-imports?projectId=5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 403 when visibility middleware rejects', async () => {
    allowVisible = false;
    const res = await request(app).get('/junit-imports?projectId=5');
    expect(res.status).toBe(403);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockImport.findAll.mockRejectedValue(new Error('DB error'));
    const res = await request(app).get('/junit-imports?projectId=5');
    expect(res.status).toBe(500);
  });
});
