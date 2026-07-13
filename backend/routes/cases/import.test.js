import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import XLSX from 'xlsx';
import casesImportRoute from './import.js';

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
    verifyProjectDeveloperFromFolderId: vi.fn((req, res, next) => {
      next();
    }),
  }),
}));

let createdCases = [];
let createdSteps = [];
let createdCaseSteps = [];
let updatedCaseCalls = [];
let existingCaseSteps = []; // pre-seeded CaseStep rows returned by CaseStep.findAll for update tests
let existingCasesByExternalId = []; // rows returned by Case.findAll (new/update resolution)

const mockCase = {
  belongsToMany: vi.fn(),
  belongsTo: vi.fn(),
  findAll: vi.fn(() => existingCasesByExternalId),
  create: vi.fn((data) => {
    const result = { id: createdCases.length + 1, ...data };
    createdCases.push(result);
    return result;
  }),
  update: vi.fn((data, opts) => {
    updatedCaseCalls.push({ data, where: opts.where });
    return [1];
  }),
};

const mockStep = {
  belongsToMany: vi.fn(),
  create: vi.fn((data) => {
    const result = { id: createdSteps.length + 1, ...data };
    createdSteps.push(result);
    return result;
  }),
  destroy: vi.fn(),
};

const mockCaseStep = {
  create: vi.fn((data) => {
    createdCaseSteps.push(data);
    return data;
  }),
  findAll: vi.fn(() => existingCaseSteps),
  destroy: vi.fn(),
};

let nextFolderId = 100;
const mockFolder = {
  findByPk: vi.fn((id) => ({ id, projectId: 1, name: 'Target Folder' })),
  findOrCreate: vi.fn(({ where }) => {
    const folder = { id: nextFolderId++, ...where };
    return [folder];
  }),
};

vi.mock('../../models/cases.js', () => ({ default: () => mockCase }));
vi.mock('../../models/steps.js', () => ({ default: () => mockStep }));
vi.mock('../../models/caseSteps.js', () => ({ default: () => mockCaseStep }));
vi.mock('../../models/folders.js', () => ({ default: () => mockFolder }));

function buildXlsxBuffer(rows, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function buildMultiSheetXlsxBuffer(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

describe('POST /import/preview and /import/commit', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', casesImportRoute(sequelize));
    vi.clearAllMocks();
    createdCases = [];
    createdSteps = [];
    createdCaseSteps = [];
    updatedCaseCalls = [];
    existingCaseSteps = [];
    existingCasesByExternalId = [];
    nextFolderId = 100;

    sequelize.transaction = vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    }));
  });

  const preview = (folderId, buffer) =>
    request(app)
      .post(`/import/preview?folderId=${folderId}`)
      .attach('file', buffer, { filename: 'test.xlsx', contentType: XLSX_CONTENT_TYPE });

  const commit = (folderId, body) => request(app).post(`/import/commit?folderId=${folderId}`).send(body);

  // ──────────────────────────────────────────
  // Preview: request-level validation
  // ──────────────────────────────────────────

  describe('preview validation', () => {
    it('returns 400 if no file is uploaded', async () => {
      const res = await request(app).post('/import/preview?folderId=1');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No file uploaded');
    });

    it('returns 404 if the target folder does not exist', async () => {
      mockFolder.findByPk.mockResolvedValueOnce(null);
      const buffer = buildXlsxBuffer([{ title: 'x', priority: 'medium', type: 'other', template: 'text' }]);
      const res = await preview(999, buffer);
      expect(res.status).toBe(404);
    });

    it('returns 400 if the workbook has no data rows anywhere', async () => {
      const buffer = buildXlsxBuffer([]);
      const res = await preview(1, buffer);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Excel file contains no data rows');
    });
  });

  // ──────────────────────────────────────────
  // Preview: v1.1 format
  // ──────────────────────────────────────────

  describe('preview v1.1 format', () => {
    it('parses a single-step case as new', async () => {
      const buffer = buildXlsxBuffer([
        { title: 'Login test', priority: 'high', type: 'functional', template: 'step', step: 'Open page', expectedStepResult: 'Page loads' },
      ]);
      const res = await preview(5, buffer);

      expect(res.status).toBe(200);
      expect(res.body.multiSheet).toBe(false);
      const sheet = res.body.sheets[0];
      expect(sheet.summary).toEqual({ total: 1, new: 1, update: 0, failed: 0 });
      expect(sheet.cases[0].status).toBe('new');
      expect(sheet.cases[0].title).toBe('Login test');
      expect(sheet.cases[0].steps).toHaveLength(1);
    });

    it('groups repeated-title rows into one case with multiple steps', async () => {
      const buffer = buildXlsxBuffer([
        { title: 'Multi step', priority: 'medium', type: 'other', template: 'step', step: 'Step 1', expectedStepResult: 'Result 1' },
        { title: 'Multi step', priority: 'medium', type: 'other', template: 'step', step: 'Step 2', expectedStepResult: 'Result 2' },
      ]);
      const res = await preview(1, buffer);

      expect(res.body.sheets[0].cases).toHaveLength(1);
      expect(res.body.sheets[0].cases[0].steps).toHaveLength(2);
      expect(res.body.sheets[0].cases[0].rowNumbers).toEqual([2, 3]);
    });

    it('reports a bad row as its own error without failing the rest of the sheet', async () => {
      const buffer = buildXlsxBuffer([
        { title: 'Good case', priority: 'medium', type: 'other', template: 'text' },
        { title: 'Bad case', priority: 'medium', type: 'other' }, // missing template
        { title: 'Another good case', priority: 'high', type: 'functional', template: 'text' },
      ]);
      const res = await preview(1, buffer);

      expect(res.status).toBe(200);
      const { cases, summary } = res.body.sheets[0];
      expect(summary).toEqual({ total: 3, new: 2, update: 0, failed: 1 });
      expect(cases.find((c) => c.title === 'Good case').status).toBe('new');
      expect(cases.find((c) => c.title === 'Another good case').status).toBe('new');
      const failed = cases.find((c) => c.status === 'error');
      expect(failed.rowNumbers).toEqual([3]);
      expect(failed.errors[0]).toContain('missing required field: template');
    });

    it('reads testCaseId as the externalId', async () => {
      const buffer = buildXlsxBuffer([
        { testCaseId: 'TC-1', title: 'Case', priority: 'medium', type: 'other', template: 'text' },
      ]);
      const res = await preview(1, buffer);
      expect(res.body.sheets[0].cases[0].externalId).toBe('TC-1');
    });

    it('treats a row with no testCaseId as always new', async () => {
      existingCasesByExternalId = []; // no externalId to match against
      const buffer = buildXlsxBuffer([{ title: 'Case', priority: 'medium', type: 'other', template: 'text' }]);
      const res = await preview(1, buffer);
      expect(res.body.sheets[0].cases[0].externalId).toBeNull();
      expect(res.body.sheets[0].cases[0].status).toBe('new');
    });

    it('tags a case update when its testCaseId matches an existing case', async () => {
      existingCasesByExternalId = [{ id: 42, externalId: 'TC-1' }];
      const buffer = buildXlsxBuffer([
        { testCaseId: 'TC-1', title: 'Case', priority: 'medium', type: 'other', template: 'text' },
      ]);
      const res = await preview(1, buffer);
      expect(res.body.sheets[0].cases[0].status).toBe('update');
      expect(res.body.sheets[0].cases[0].matchedCaseId).toBe(42);
    });
  });

  // ──────────────────────────────────────────
  // Preview: reference format
  // ──────────────────────────────────────────

  describe('preview reference format', () => {
    it('parses a case with numbered multiline steps', async () => {
      const buffer = buildXlsxBuffer([
        {
          'Test Case ID': 'TC-001',
          'Test Scenario': 'Login works',
          'Test Steps': '1. Open page\n2. Enter creds\n3. Submit',
          'Expected Result': 'Logged in',
        },
      ]);
      const res = await preview(10, buffer);

      const c = res.body.sheets[0].cases[0];
      expect(c.status).toBe('new');
      expect(c.externalId).toBe('TC-001');
      expect(c.steps).toHaveLength(3);
      expect(c.steps[0].step).toBe('Open page');
    });

    it('reports a row missing Test Scenario as an error without failing other rows', async () => {
      const buffer = buildXlsxBuffer([
        { 'Test Scenario': 'Good row', 'Test Steps': '1. Step' },
        { 'Test Case ID': 'TC-BAD', 'Test Steps': '1. Step' }, // missing Test Scenario
      ]);
      const res = await preview(1, buffer);

      const { summary, cases } = res.body.sheets[0];
      expect(summary).toEqual({ total: 2, new: 1, update: 0, failed: 1 });
      const failed = cases.find((c) => c.status === 'error');
      expect(failed.rowNumbers).toEqual([3]);
      expect(failed.errors[0]).toContain('missing required field: Test Scenario');
    });

    it('flags a duplicate Test Case ID within the same upload as an error', async () => {
      const buffer = buildXlsxBuffer([
        { 'Test Case ID': 'TC-DUP', 'Test Scenario': 'First', 'Test Steps': '1. A' },
        { 'Test Case ID': 'TC-DUP', 'Test Scenario': 'Second', 'Test Steps': '1. B' },
      ]);
      const res = await preview(1, buffer);

      const { cases, summary } = res.body.sheets[0];
      expect(summary.new).toBe(1);
      expect(summary.failed).toBe(1);
      expect(cases[0].status).toBe('new');
      expect(cases[1].status).toBe('error');
      expect(cases[1].errors[0]).toContain('duplicate Test Case ID');
    });

    it('captures the Module column without creating a folder yet', async () => {
      const buffer = buildXlsxBuffer([
        { 'Test Case ID': 'TC-1', 'Module': 'Auth', 'Test Scenario': 'Login', 'Test Steps': '1. Step' },
      ]);
      const res = await preview(5, buffer);

      expect(res.body.sheets[0].cases[0].module).toBe('Auth');
      expect(mockFolder.findOrCreate).not.toHaveBeenCalled();
    });

    it('auto-detects reference format from the Test Scenario header', async () => {
      const buffer = buildXlsxBuffer([{ 'Test Scenario': 'Ref case', 'Test Steps': '1. Do something' }]);
      const res = await preview(1, buffer);
      expect(res.body.sheets[0].cases[0].title).toBe('Ref case');
    });
  });

  // ──────────────────────────────────────────
  // Preview: multi-sheet
  // ──────────────────────────────────────────

  describe('preview multi-sheet', () => {
    it('sets multiSheet and per-sheet targetFolderName for a multi-sheet workbook', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Login Tests': [{ 'Test Scenario': 'Login', 'Test Steps': '1. Step' }],
        'Cart Tests': [{ 'Test Scenario': 'Cart', 'Test Steps': '1. Step' }],
      });
      const res = await preview(1, buffer);

      expect(res.body.multiSheet).toBe(true);
      expect(res.body.sheets).toHaveLength(2);
      expect(res.body.sheets[0].targetFolderName).toBe('Login Tests');
      expect(res.body.sheets[1].targetFolderName).toBe('Cart Tests');
      // No folders are created during preview
      expect(mockFolder.findOrCreate).not.toHaveBeenCalled();
    });

    it('uses the target folder name (not a sheet name) for single-sheet workbooks', async () => {
      const buffer = buildXlsxBuffer([{ 'Test Scenario': 'Case', 'Test Steps': '1. Step' }]);
      const res = await preview(1, buffer);
      expect(res.body.multiSheet).toBe(false);
      expect(res.body.sheets[0].targetFolderName).toBe('Target Folder');
    });

    it('skips empty sheets entirely', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Has Data': [{ 'Test Scenario': 'Case', 'Test Steps': '1. Step' }],
        'Empty Sheet': [],
      });
      const res = await preview(1, buffer);
      expect(res.body.sheets.map((s) => s.sheetName)).toEqual(['Has Data']);
    });
  });

  // ──────────────────────────────────────────
  // Commit
  // ──────────────────────────────────────────

  describe('commit', () => {
    it('returns 400 when no sheets are provided', async () => {
      const res = await commit(1, { multiSheet: false, sheets: [] });
      expect(res.status).toBe(400);
    });

    it('creates a new case and its steps', async () => {
      const res = await commit(1, {
        multiSheet: false,
        sheets: [
          {
            sheetName: 'Sheet1',
            cases: [
              {
                status: 'new',
                title: 'New case',
                description: '',
                priority: 1,
                type: 0,
                preConditions: '',
                expectedResults: '',
                automationStatus: 0,
                template: 1,
                externalId: 'TC-1',
                module: null,
                steps: [{ stepNo: 1, step: 'Step 1', result: 'Result 1' }],
              },
            ],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ created: 1, updated: 0 });
      expect(createdCases).toHaveLength(1);
      expect(createdCases[0].folderId).toBe('1');
      expect(createdCases[0].externalId).toBe('TC-1');
      expect(createdSteps).toHaveLength(1);
      expect(createdCaseSteps[0].caseId).toBe(1);
    });

    it('skips cases with status error even if present in the payload', async () => {
      const res = await commit(1, {
        multiSheet: false,
        sheets: [
          {
            sheetName: 'Sheet1',
            cases: [{ status: 'error', rowNumbers: [2], errors: ['bad'] }],
          },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ created: 0, updated: 0 });
      expect(createdCases).toHaveLength(0);
    });

    it('updates a matched case in place and replaces its steps', async () => {
      existingCaseSteps = [{ stepId: 501 }, { stepId: 502 }];

      const res = await commit(1, {
        multiSheet: false,
        sheets: [
          {
            sheetName: 'Sheet1',
            cases: [
              {
                status: 'update',
                matchedCaseId: 42,
                title: 'Updated title',
                description: 'Updated description',
                priority: 0,
                type: 4,
                preConditions: '',
                expectedResults: '',
                automationStatus: 0,
                template: 0,
                externalId: 'TC-1',
                module: null,
                steps: [{ stepNo: 1, step: 'New step', result: 'New result' }],
              },
            ],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ created: 0, updated: 1 });

      // Case fields fully replaced
      expect(updatedCaseCalls[0].where).toEqual({ id: 42 });
      expect(updatedCaseCalls[0].data.title).toBe('Updated title');

      // Old steps torn down
      expect(mockCaseStep.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { caseId: 42 } }));
      expect(mockStep.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { id: [501, 502] } }));

      // New step created and linked to the existing case id
      expect(createdSteps[0].step).toBe('New step');
      expect(createdCaseSteps[0].caseId).toBe(42);
    });

    it('creates sheet folders for a multi-sheet commit and assigns cases to them', async () => {
      const res = await commit(1, {
        multiSheet: true,
        sheets: [
          {
            sheetName: 'Login Tests',
            cases: [
              {
                status: 'new',
                title: 'Case A',
                priority: 2,
                type: 0,
                automationStatus: 0,
                template: 0,
                externalId: null,
                module: null,
                steps: [],
              },
            ],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Login Tests', parentFolderId: '1', projectId: 1 } })
      );
      expect(createdCases[0].folderId).toBe(100);
    });

    it('creates module subfolders under the sheet folder', async () => {
      const res = await commit(5, {
        multiSheet: false,
        sheets: [
          {
            sheetName: 'Sheet1',
            cases: [
              {
                status: 'new',
                title: 'Case A',
                priority: 2,
                type: 0,
                automationStatus: 0,
                template: 0,
                externalId: null,
                module: 'Auth',
                steps: [],
              },
            ],
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Auth', parentFolderId: '5', projectId: 1 } })
      );
      expect(createdCases[0].folderId).toBe(100);
    });
  });
});
