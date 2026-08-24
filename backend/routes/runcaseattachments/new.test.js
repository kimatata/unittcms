import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import runCaseAttachmentsNewRoute from './new.js';

const testUploadDir = path.join(os.tmpdir(), 'unittcms-upload-test');

// ── auth / permission mocks ──────────────────────────────────────────────────
let mockReporterCheck = true;
let reporterCheckCalls = 0;

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
      reporterCheckCalls++;
      if (mockReporterCheck) return next();
      return res.status(403).json({ error: 'Forbidden' });
    }),
  }),
}));

// ── upload mock ──────────────────────────────────────────────────────────────
// Stands in for multer so no multipart body is needed to drive the route.
let mockFiles = [];
let uploadCalls = 0;

vi.mock('../../config/upload.js', () => ({
  uploadFiles: (req, res, next) => {
    uploadCalls++;
    req.files = mockFiles;
    next();
  },
  uploadDir: path.join(os.tmpdir(), 'unittcms-upload-test'),
}));

// ── model mocks ──────────────────────────────────────────────────────────────
const mockAttachment = {
  bulkCreate: vi.fn(),
};

vi.mock('../../models/attachments.js', () => ({
  default: () => mockAttachment,
}));

const mockRunCaseAttachment = {
  bulkCreate: vi.fn(),
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
  app.use('/runcaseattachments', runCaseAttachmentsNewRoute(sequelize));
  return app;
}

// Writes real files so the rollback cleanup path can be observed.
function writeUploadedFiles(names) {
  fs.mkdirSync(testUploadDir, { recursive: true });
  return names.map((name) => {
    fs.writeFileSync(path.join(testUploadDir, name), 'x');
    return { originalname: name, filename: name };
  });
}

async function waitForRemoval(filename) {
  const filePath = path.join(testUploadDir, filename);
  for (let i = 0; i < 40; i++) {
    if (!fs.existsSync(filePath)) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return !fs.existsSync(filePath);
}

// ── tests ────────────────────────────────────────────────────────────────────
describe('POST /runcaseattachments', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReporterCheck = true;
    reporterCheckCalls = 0;
    uploadCalls = 0;
    mockFiles = [];
    lastTransaction = undefined;
    app = makeApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(testUploadDir, { recursive: true, force: true });
  });

  it('links the uploaded files to the run case', async () => {
    mockFiles = [
      { originalname: 'screenshot.png', filename: 'screenshot.png' },
      { originalname: 'log.txt', filename: 'log_1.txt' },
    ];
    const created = [
      { id: 11, title: 'screenshot.png', filename: 'screenshot.png' },
      { id: 12, title: 'log.txt', filename: 'log_1.txt' },
    ];
    mockAttachment.bulkCreate.mockResolvedValue(created);
    mockRunCaseAttachment.bulkCreate.mockResolvedValue([]);

    const res = await request(app).post('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(created);
    expect(mockAttachment.bulkCreate).toHaveBeenCalledWith(
      [
        { title: 'screenshot.png', filename: 'screenshot.png' },
        { title: 'log.txt', filename: 'log_1.txt' },
      ],
      expect.anything()
    );
    expect(mockRunCaseAttachment.bulkCreate).toHaveBeenCalledWith(
      [
        { runCaseId: '5', attachmentId: 11 },
        { runCaseId: '5', attachmentId: 12 },
      ],
      expect.anything()
    );
    expect(lastTransaction.commit).toHaveBeenCalled();
  });

  it('returns 400 when no files were uploaded', async () => {
    mockFiles = [];

    const res = await request(app).post('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(400);
    expect(mockAttachment.bulkCreate).not.toHaveBeenCalled();
    expect(mockRunCaseAttachment.bulkCreate).not.toHaveBeenCalled();
  });

  it('returns 403 for a user below reporter, before any file is received', async () => {
    mockReporterCheck = false;
    mockFiles = [{ originalname: 'screenshot.png', filename: 'screenshot.png' }];

    const res = await request(app).post('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(403);
    expect(reporterCheckCalls).toBe(1);
    // the permission check runs ahead of multer, so nothing is written to disk
    expect(uploadCalls).toBe(0);
    expect(mockAttachment.bulkCreate).not.toHaveBeenCalled();
  });

  it('rolls back and removes the uploaded files when linking fails', async () => {
    mockFiles = writeUploadedFiles(['orphan.png']);
    mockAttachment.bulkCreate.mockResolvedValue([{ id: 11, title: 'orphan.png', filename: 'orphan.png' }]);
    mockRunCaseAttachment.bulkCreate.mockRejectedValue(new Error('constraint failed'));

    const res = await request(app).post('/runcaseattachments?runCaseId=5');

    expect(res.status).toBe(500);
    expect(lastTransaction.rollback).toHaveBeenCalled();
    expect(lastTransaction.commit).not.toHaveBeenCalled();
    expect(await waitForRemoval('orphan.png')).toBe(true);
  });
});
