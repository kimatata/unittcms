import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import homeIndexRoute from './index.js';

// ── auth / permission mocks ──────────────────────────────────────────────────
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

// ── model mocks ──────────────────────────────────────────────────────────────
const mockProject = { findByPk: vi.fn(), hasMany: vi.fn() };
const mockFolder = { findAll: vi.fn(), hasMany: vi.fn() };
const mockCase = {};
const mockRun = { findAll: vi.fn(), hasMany: vi.fn() };
const mockRunCase = {};

vi.mock('../../models/projects.js', () => ({ default: () => mockProject }));
vi.mock('../../models/folders.js', () => ({ default: () => mockFolder }));
vi.mock('../../models/cases.js', () => ({ default: () => mockCase }));
vi.mock('../../models/runs.js', () => ({ default: () => mockRun }));
vi.mock('../../models/runCases.js', () => ({ default: () => mockRunCase }));

// ── helpers ──────────────────────────────────────────────────────────────────
function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  app.use('/home', homeIndexRoute(sequelize));
  return app;
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('GET /home/:projectId', () => {
  let app;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it('returns the project with its folders, cases, runs and run cases', async () => {
    mockProject.findByPk.mockResolvedValue({ toJSON: () => ({ id: 1, name: 'Demo' }) });
    mockFolder.findAll.mockResolvedValue([{ id: 7, Cases: [{ id: 3, type: 4, priority: 1 }] }]);
    mockRun.findAll.mockResolvedValue([
      { id: 9, RunCases: [{ id: 5, status: 1, createdAt: '2026-01-01 00:00:00.000 +00:00' }] },
    ]);

    const res = await request(app).get('/home/1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      name: 'Demo',
      Folders: [{ id: 7, Cases: [{ id: 3, type: 4, priority: 1 }] }],
      Runs: [{ id: 9, RunCases: [{ id: 5, status: 1 }] }],
    });
  });

  it('does not nest both hasMany branches in a single query', async () => {
    // Regression guard. Loading folders->cases AND runs->runCases through one
    // `findByPk` include makes Sequelize emit a cartesian product; on a project
    // with ~1000 cases and 9 runs the response never comes back and the process
    // dies with "JavaScript heap out of memory". Each association must be
    // fetched by its own query.
    mockProject.findByPk.mockResolvedValue({ toJSON: () => ({ id: 1 }) });
    mockFolder.findAll.mockResolvedValue([]);
    mockRun.findAll.mockResolvedValue([]);

    await request(app).get('/home/1');

    expect(mockProject.findByPk).toHaveBeenCalledWith('1');
    expect(mockFolder.findAll).toHaveBeenCalledTimes(1);
    expect(mockRun.findAll).toHaveBeenCalledTimes(1);

    const folderQuery = mockFolder.findAll.mock.calls[0][0];
    const runQuery = mockRun.findAll.mock.calls[0][0];
    expect(folderQuery.include).toHaveLength(1);
    expect(runQuery.include).toHaveLength(1);
  });

  it('selects only the columns the home page aggregates', async () => {
    mockProject.findByPk.mockResolvedValue({ toJSON: () => ({ id: 1 }) });
    mockFolder.findAll.mockResolvedValue([]);
    mockRun.findAll.mockResolvedValue([]);

    await request(app).get('/home/1');

    expect(mockFolder.findAll.mock.calls[0][0].include[0].attributes).toEqual(['id', 'type', 'priority']);
    expect(mockRun.findAll.mock.calls[0][0].include[0].attributes).toEqual(['id', 'status', 'createdAt']);
  });

  it('returns 404 when the project does not exist', async () => {
    mockProject.findByPk.mockResolvedValue(null);

    const res = await request(app).get('/home/404');

    expect(res.status).toBe(404);
    expect(mockFolder.findAll).not.toHaveBeenCalled();
    expect(mockRun.findAll).not.toHaveBeenCalled();
  });

  it('returns 500 when a query fails', async () => {
    mockProject.findByPk.mockRejectedValue(new Error('db is down'));

    const res = await request(app).get('/home/1');

    expect(res.status).toBe(500);
  });
});
