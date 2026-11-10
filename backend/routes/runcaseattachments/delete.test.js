import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import runCaseAttachmentsDeleteRoute from './delete.js';

// ── auth / permission mocks ──────────────────────────────────────────────────
let mockReporterCheck = true;

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
    verifyProjectReporterFromRunCaseId: vi.fn((req, res, next) => {
      if (mockReporterCheck) return next();
      return res.status(403).json({ error: 'Forbidden' });
    }),
  }),
}));

vi.mock('../../config/upload.js', () => ({
  uploadDir: path.join(os.tmpdir(), 'unittcms-upload-test'),
}));

// ── model mocks ──────────────────────────────────────────────────────────────
const mockAttachment = {
  findByPk: vi.fn(),
};

vi.mock('../../models/attachments.js', () => ({
  default: () => mockAttachment,
}));

const mockRunCaseAttachment = {
  findOne: vi.fn(),
};

vi.mock('../../models/runCaseAttachments.js', () => ({
  default: () => mockRunCaseAttachment,
}));

// ── helpers ──────────────────────────────────────────────────────────────────
let lastTransaction;

function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  sequelize.transaction = vi.fn(async () => {
    lastTransaction = { commit: vi.fn(), rollback: vi.fn() };
    return lastTransaction;
  });
  app.use('/runcaseattachments', runCaseAttachmentsDeleteRoute(sequelize));
  return app;
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('DELETE /runcaseattachments/:attachmentId', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReporterCheck = true;
    lastTransaction = undefined;
    app = makeApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes the link and the attachment', async () => {
    const joinRow = { runCaseId: 5, attachmentId: 11, destroy: vi.fn() };
    const attachment = { id: 11, filename: 'screenshot.png', destroy: vi.fn() };
    mockRunCaseAttachment.findOne.mockResolvedValue(joinRow);
    mockAttachment.findByPk.mockResolvedValue(attachment);

    const res = await request(app).delete('/runcaseattachments/11?runCaseId=5');

    expect(res.status).toBe(204);
    expect(mockRunCaseAttachment.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { runCaseId: '5', attachmentId: '11' } })
    );
    expect(joinRow.destroy).toHaveBeenCalled();
    expect(attachment.destroy).toHaveBeenCalled();
    expect(lastTransaction.commit).toHaveBeenCalled();
  });

  it('returns 404 when the attachment belongs to a different run case', async () => {
    mockRunCaseAttachment.findOne.mockResolvedValue(null);
    const attachment = { id: 11, filename: 'screenshot.png', destroy: vi.fn() };
    mockAttachment.findByPk.mockResolvedValue(attachment);

    const res = await request(app).delete('/runcaseattachments/11?runCaseId=999');

    expect(res.status).toBe(404);
    // another run case's attachment must survive
    expect(attachment.destroy).not.toHaveBeenCalled();
    expect(lastTransaction.rollback).toHaveBeenCalled();
    expect(lastTransaction.commit).not.toHaveBeenCalled();
  });

  it('returns 404 when the attachment row is already gone', async () => {
    const joinRow = { runCaseId: 5, attachmentId: 11, destroy: vi.fn() };
    mockRunCaseAttachment.findOne.mockResolvedValue(joinRow);
    mockAttachment.findByPk.mockResolvedValue(null);

    const res = await request(app).delete('/runcaseattachments/11?runCaseId=5');

    expect(res.status).toBe(404);
    expect(joinRow.destroy).not.toHaveBeenCalled();
    expect(lastTransaction.rollback).toHaveBeenCalled();
  });

  it('returns 403 for a user below reporter', async () => {
    mockReporterCheck = false;

    const res = await request(app).delete('/runcaseattachments/11?runCaseId=5');

    expect(res.status).toBe(403);
    expect(mockRunCaseAttachment.findOne).not.toHaveBeenCalled();
  });

  it('rolls back when the delete fails', async () => {
    const joinRow = { runCaseId: 5, attachmentId: 11, destroy: vi.fn() };
    const attachment = {
      id: 11,
      filename: 'screenshot.png',
      destroy: vi.fn().mockRejectedValue(new Error('db is locked')),
    };
    mockRunCaseAttachment.findOne.mockResolvedValue(joinRow);
    mockAttachment.findByPk.mockResolvedValue(attachment);

    const res = await request(app).delete('/runcaseattachments/11?runCaseId=5');

    expect(res.status).toBe(500);
    expect(lastTransaction.rollback).toHaveBeenCalled();
    expect(lastTransaction.commit).not.toHaveBeenCalled();
  });
});
