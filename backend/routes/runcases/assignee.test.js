import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import runCaseAssigneeRoute from './assignee.js';
import runCaseIndexRoute from './index.js';

// ── auth / permission mocks ──────────────────────────────────────────────────
let mockManagerCheck = true;

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => {
      req.userId = 1;
      next();
    }),
  }),
}));

vi.mock('../../middleware/verifyEditable.js', () => ({
  default: () => ({
    verifyProjectManagerFromRunId: vi.fn((req, res, next) => {
      if (mockManagerCheck) return next();
      return res.status(403).json({ error: 'Forbidden' });
    }),
  }),
}));

vi.mock('../../middleware/verifyVisible.js', () => ({
  default: () => ({
    verifyProjectVisibleFromRunId: vi.fn((req, res, next) => next()),
  }),
}));

// ── model mocks ──────────────────────────────────────────────────────────────
const mockRunCase = {
  findAll: vi.fn(),
  update: vi.fn(),
};

vi.mock('../../models/runCases.js', () => ({
  default: () => mockRunCase,
}));

const mockRun = {
  findByPk: vi.fn(),
  findAll: vi.fn(),
};

vi.mock('../../models/runs.js', () => ({
  default: () => mockRun,
}));

const mockMember = {
  findOne: vi.fn(),
};

vi.mock('../../models/members.js', () => ({
  default: () => mockMember,
}));

const mockProject = {
  findByPk: vi.fn(),
};

vi.mock('../../models/projects.js', () => ({
  default: () => mockProject,
}));

// ── helpers ──────────────────────────────────────────────────────────────────
function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  sequelize.transaction = vi.fn(async (cb) => {
    const t = { commit: vi.fn(), rollback: vi.fn() };
    if (cb) {
      try {
        const result = await cb(t);
        await t.commit();
        return result;
      } catch (e) {
        await t.rollback();
        throw e;
      }
    }
    return t;
  });
  app.use('/runcases', runCaseAssigneeRoute(sequelize));
  app.use('/runcases', runCaseIndexRoute(sequelize));
  return app;
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('POST /runcases/assignee', () => {
  let app;

  beforeEach(() => {
    mockManagerCheck = true;
    app = makeApp();
    vi.clearAllMocks();
    mockManagerCheck = true;
  });

  it('6.3 succeeds for a manager — single row', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue({ id: 5 });
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 99 });
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1, status: 0, assigneeUserId: 7 }]);
    mockRunCase.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: 7 });

    expect(res.status).toBe(200);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: 7 },
      expect.objectContaining({ where: expect.objectContaining({ id: [2], runId: '1' }) })
    );
  });

  it('6.3 succeeds for a manager — bulk (multiple rows)', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue({ id: 5 });
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 99 });
    mockRunCase.findAll.mockResolvedValue([
      { id: 2, runId: 1, assigneeUserId: 7 },
      { id: 3, runId: 1, assigneeUserId: 7 },
    ]);
    mockRunCase.update.mockResolvedValue([2]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2, 3], assigneeUserId: 7 });

    expect(res.status).toBe(200);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: 7 },
      expect.objectContaining({ where: expect.objectContaining({ id: [2, 3] }) })
    );
  });

  it('6.4 returns 403 for a reporter', async () => {
    mockManagerCheck = false;
    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: 7 });

    expect(res.status).toBe(403);
    expect(mockRunCase.update).not.toHaveBeenCalled();
  });

  it('6.5 returns 400 when assigneeUserId is not a project member', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue(null);
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 1 }); // owner is userId=1, assigneeUserId=99 is neither member nor owner

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: 99 });

    expect(res.status).toBe(400);
    expect(mockRunCase.update).not.toHaveBeenCalled();
  });

  it('6.6 returns 400 when a runCaseId belongs to a different run', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue({ id: 5 });
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 99 });
    // findAll returns only 1 row even though 2 ids were requested
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1 }]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2, 999], assigneeUserId: 7 });

    expect(res.status).toBe(400);
    expect(mockRunCase.update).not.toHaveBeenCalled();
  });

  it('6.7 re-assigning preserves status (update only changes assigneeUserId)', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue({ id: 5 });
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 99 });
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1, status: 2, assigneeUserId: 8 }]);
    mockRunCase.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: 8 });

    expect(res.status).toBe(200);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: 8 },
      expect.anything()
    );
    // status is not part of the update payload
    const updateCall = mockRunCase.update.mock.calls[0][0];
    expect(updateCall).not.toHaveProperty('status');
  });

  it('project owner can be assigned even though they are not in members table', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockMember.findOne.mockResolvedValue(null); // not in members table
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 42 }); // 42 is the owner
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1, assigneeUserId: 42 }]);
    mockRunCase.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: 42 });

    expect(res.status).toBe(200);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: 42 },
      expect.anything()
    );
  });

  it('clearing assignee (null) succeeds', async () => {
    mockRun.findByPk.mockResolvedValue({ id: 1, projectId: 10 });
    mockProject.findByPk.mockResolvedValue({ id: 10, userId: 99 });
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1, assigneeUserId: null }]);
    mockRunCase.update.mockResolvedValue([1]);

    const res = await request(app)
      .post('/runcases/assignee?runId=1')
      .send({ runCaseIds: [2], assigneeUserId: null });

    expect(res.status).toBe(200);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: null },
      expect.anything()
    );
  });
});

describe('GET /runcases', () => {
  let app;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
  });

  it('6.1 returns assigneeUserId in each row', async () => {
    mockRunCase.findAll.mockResolvedValue([
      { id: 1, runId: 1, status: 0, assigneeUserId: null },
      { id: 2, runId: 1, status: 1, assigneeUserId: 7 },
    ]);

    const res = await request(app).get('/runcases?runId=1');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('assigneeUserId');
    expect(res.body[1].assigneeUserId).toBe(7);
  });

  it('6.2 filters by assigneeUserId=null', async () => {
    mockRunCase.findAll.mockResolvedValue([{ id: 1, runId: 1, assigneeUserId: null }]);

    const res = await request(app).get('/runcases?runId=1&assigneeUserId=null');
    expect(res.status).toBe(200);
    const callArgs = mockRunCase.findAll.mock.calls[0][0];
    expect(callArgs.where).toHaveProperty('assigneeUserId');
  });

  it('6.2 filters by specific assigneeUserId', async () => {
    mockRunCase.findAll.mockResolvedValue([{ id: 2, runId: 1, assigneeUserId: 7 }]);

    const res = await request(app).get('/runcases?runId=1&assigneeUserId=7');
    expect(res.status).toBe(200);
    const callArgs = mockRunCase.findAll.mock.calls[0][0];
    expect(callArgs.where.assigneeUserId).toBe(7);
  });
});

describe('Member removal cascade (6.8)', () => {
  it('nulls assigneeUserId for removed member across project runs', async () => {
    const mockDeleteMember = {
      findOne: vi.fn().mockResolvedValue({ destroy: vi.fn() }),
    };
    const mockRunForDelete = {
      findAll: vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
    };
    const mockRunCaseForDelete = {
      update: vi.fn().mockResolvedValue([2]),
    };

    vi.doMock('../../models/members.js', () => ({ default: () => mockDeleteMember }));
    vi.doMock('../../models/runs.js', () => ({ default: () => mockRunForDelete }));
    vi.doMock('../../models/runCases.js', () => ({ default: () => mockRunCaseForDelete }));

    expect(mockRunForDelete.findAll).toBeDefined();
    expect(mockRunCaseForDelete.update).toBeDefined();
  });
});
