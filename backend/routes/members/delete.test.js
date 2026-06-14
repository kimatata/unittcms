import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import membersDeleteRoute from './delete.js';

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
    verifyProjectManagerFromProjectId: vi.fn((req, res, next) => next()),
  }),
}));

const mockMember = {
  findOne: vi.fn(),
};
vi.mock('../../models/members.js', () => ({
  default: () => mockMember,
}));

const mockRun = {
  findAll: vi.fn(),
};
vi.mock('../../models/runs.js', () => ({
  default: () => mockRun,
}));

const mockRunCase = {
  update: vi.fn(),
};
vi.mock('../../models/runCases.js', () => ({
  default: () => mockRunCase,
}));

function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  sequelize.transaction = vi.fn(async () => ({ commit: vi.fn(), rollback: vi.fn() }));
  app.use('/members', membersDeleteRoute(sequelize));
  return app;
}

describe('DELETE /members — assignment cascade (6.8)', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('nulls assigneeUserId for the removed user across all runs in the project', async () => {
    mockMember.findOne.mockResolvedValue({ id: 5, destroy: vi.fn() });
    mockRun.findAll.mockResolvedValue([{ id: 100 }, { id: 101 }]);
    mockRunCase.update.mockResolvedValue([3]);

    const res = await request(app).delete('/members?userId=42&projectId=10');

    expect(res.status).toBe(204);
    expect(mockRunCase.update).toHaveBeenCalledWith(
      { assigneeUserId: null },
      expect.objectContaining({
        where: { runId: [100, 101], assigneeUserId: 42 },
      })
    );
  });

  it('skips the cascade update when the project has no runs', async () => {
    mockMember.findOne.mockResolvedValue({ id: 5, destroy: vi.fn() });
    mockRun.findAll.mockResolvedValue([]);

    const res = await request(app).delete('/members?userId=42&projectId=10');

    expect(res.status).toBe(204);
    expect(mockRunCase.update).not.toHaveBeenCalled();
  });

  it('returns 404 when the member does not exist (no cascade)', async () => {
    mockMember.findOne.mockResolvedValue(null);

    const res = await request(app).delete('/members?userId=42&projectId=10');

    expect(res.status).toBe(404);
    expect(mockRunCase.update).not.toHaveBeenCalled();
  });

  it('returns 400 when userId is missing or invalid', async () => {
    const res = await request(app).delete('/members?projectId=10');
    expect(res.status).toBe(400);
    expect(mockMember.findOne).not.toHaveBeenCalled();
  });

  it('returns 400 when projectId is missing or invalid', async () => {
    const res = await request(app).delete('/members?userId=42');
    expect(res.status).toBe(400);
    expect(mockMember.findOne).not.toHaveBeenCalled();
  });
});
