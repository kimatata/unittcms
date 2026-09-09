import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import runCaseAttachmentsIndexRoute from './index.js';

// ── auth / permission mocks ──────────────────────────────────────────────────
let mockVisibleCheck = true;

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
    verifyProjectVisibleFromRunCaseId: vi.fn((req, res, next) => {
      if (mockVisibleCheck) return next();
      return res.status(403).json({ error: 'Forbidden' });
    }),
  }),
}));

// ── model mocks ──────────────────────────────────────────────────────────────
const mockRunCase = {
  findByPk: vi.fn(),
  belongsToMany: vi.fn(),
};

vi.mock('../../models/runCases.js', () => ({
  default: () => mockRunCase,
}));

const mockAttachment = {
  belongsToMany: vi.fn(),
};

vi.mock('../../models/attachments.js', () => ({
  default: () => mockAttachment,
}));

// ── helpers ──────────────────────────────────────────────────────────────────
function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  app.use('/runcaseattachments', runCaseAttachmentsIndexRoute(sequelize));
  return app;
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('GET /runcaseattachments', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockVisibleCheck = true;
    app = makeApp();
  });

  it('returns the attachments of the run case', async () => {
    const attachments = [{ id: 11, title: 'screenshot.png', filename: 'screenshot.png' }];
    mockRunCase.findByPk.mockResolvedValue({ id: 5, Attachments: attachments });

    const res = await request(app).get('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(attachments);
  });

  it('returns an empty list when the run case has no attachments', async () => {
    mockRunCase.findByPk.mockResolvedValue({ id: 5 });

    const res = await request(app).get('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 400 when runCaseId is missing', async () => {
    const res = await request(app).get('/runcaseattachments');

    expect(res.status).toBe(400);
    expect(mockRunCase.findByPk).not.toHaveBeenCalled();
  });

  it('returns 404 when the run case does not exist', async () => {
    mockRunCase.findByPk.mockResolvedValue(null);

    const res = await request(app).get('/runcaseattachments?runCaseId=999');

    expect(res.status).toBe(404);
  });

  it('returns 403 when the project is not visible to the user', async () => {
    mockVisibleCheck = false;

    const res = await request(app).get('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(403);
    expect(mockRunCase.findByPk).not.toHaveBeenCalled();
  });
});
