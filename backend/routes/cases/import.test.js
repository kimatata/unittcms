import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import XLSX from 'xlsx';
import casesImportRoute from './import.js';

// mock of authentication middleware
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

const createdCases = [];
const createdSteps = [];
const createdCaseSteps = [];

const mockCase = {
  belongsToMany: vi.fn(),
  bulkCreate: vi.fn((data, opts) => {
    const results = data.map((d, i) => ({ id: i + 1, ...d }));
    createdCases.push(...results);
    return results;
  }),
};

const mockStep = {
  belongsToMany: vi.fn(),
  create: vi.fn((data, opts) => {
    const result = { id: createdSteps.length + 1, ...data };
    createdSteps.push(result);
    return result;
  }),
};

const mockCaseStep = {
  create: vi.fn((data, opts) => {
    createdCaseSteps.push(data);
    return data;
  }),
};

let nextFolderId = 100;
const mockFolder = {
  findByPk: vi.fn((id) => ({ id, projectId: 1 })),
  findOrCreate: vi.fn(({ where }) => {
    const folder = { id: nextFolderId++, ...where };
    return [folder];
  }),
};

vi.mock('../../models/cases.js', () => ({
  default: () => mockCase,
}));
vi.mock('../../models/steps.js', () => ({
  default: () => mockStep,
}));
vi.mock('../../models/caseSteps.js', () => ({
  default: () => mockCaseStep,
}));
vi.mock('../../models/folders.js', () => ({
  default: () => mockFolder,
}));

// Helper to build an xlsx buffer from an array of row objects
function buildXlsxBuffer(rows, sheetName = 'Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// Helper to build a multi-sheet xlsx buffer
// sheets: { sheetName: [rows], ... }
function buildMultiSheetXlsxBuffer(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

describe('POST /import', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', casesImportRoute(sequelize));
    vi.clearAllMocks();
    createdCases.length = 0;
    createdSteps.length = 0;
    createdCaseSteps.length = 0;
    nextFolderId = 100;

    // mock transaction
    sequelize.transaction = vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    }));
  });

  // ──────────────────────────────────────────
  // Validation tests
  // ──────────────────────────────────────────

  it('should return 400 if no file is uploaded', async () => {
    const res = await request(app).post('/import?folderId=1');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('No file uploaded');
  });

  it('should return 400 if folderId is missing', async () => {
    const buffer = buildXlsxBuffer([{ title: 'test', priority: 'medium', type: 'other', template: 'text' }]);
    const res = await request(app)
      .post('/import')
      .attach('file', buffer, { filename: 'test.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('folderId is required');
  });

  it('should return 400 if Excel file has no data rows', async () => {
    const buffer = buildXlsxBuffer([]);
    const res = await request(app)
      .post('/import?folderId=1')
      .attach('file', buffer, { filename: 'empty.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Excel file contains no data rows');
  });

  // ──────────────────────────────────────────
  // v1.1 format tests
  // ──────────────────────────────────────────

  describe('v1.1 format (multi-row steps)', () => {
    it('should import a single case with one step', async () => {
      const rows = [
        { title: 'Login test', priority: 'high', type: 'functional', template: 'step', step: 'Open login page', expectedStepResult: 'Page loads' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=5')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Login test');
      expect(res.body[0].folderId).toBe('5');
      expect(res.body[0].priority).toBe(1); // high = index 1
      expect(res.body[0].type).toBe(4); // functional = index 4

      expect(mockStep.create).toHaveBeenCalledTimes(1);
      expect(createdSteps[0].step).toBe('Open login page');
      expect(createdSteps[0].result).toBe('Page loads');
    });

    it('should import a case with multiple steps (repeated title rows)', async () => {
      const rows = [
        { title: 'Multi step case', priority: 'medium', type: 'other', template: 'step', step: 'Step 1', expectedStepResult: 'Result 1' },
        { title: 'Multi step case', priority: 'medium', type: 'other', template: 'step', step: 'Step 2', expectedStepResult: 'Result 2' },
        { title: 'Multi step case', priority: 'medium', type: 'other', template: 'step', step: 'Step 3', expectedStepResult: 'Result 3' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1); // Single case
      expect(mockStep.create).toHaveBeenCalledTimes(3); // Three steps

      // Verify step numbers
      expect(createdCaseSteps[0].stepNo).toBe(1);
      expect(createdCaseSteps[1].stepNo).toBe(2);
      expect(createdCaseSteps[2].stepNo).toBe(3);
    });

    it('should import multiple cases with varying step counts', async () => {
      const rows = [
        { title: 'case 1', priority: 'medium', type: 'other', template: 'step', step: 'Step 1', expectedStepResult: 'Result 1' },
        { title: 'case 1', priority: 'medium', type: 'other', template: 'step', step: 'Step 2', expectedStepResult: 'Result 2' },
        { title: 'case 2', priority: 'high', type: 'functional', template: 'step', step: 'Only step', expectedStepResult: 'Only result' },
        { title: 'case 3', priority: 'low', type: 'other', template: 'text' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3); // Three cases
      expect(mockStep.create).toHaveBeenCalledTimes(4); // 2 + 1 + 1 steps
    });

    it('should return 400 for v1.1 row missing required field', async () => {
      const rows = [
        { title: 'case 1', priority: 'medium', type: 'other' }, // missing template
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('missing required field: template');
    });

    it('should return 400 for v1.1 row with invalid priority', async () => {
      const rows = [
        { title: 'case 1', priority: 'super-high', type: 'other', template: 'text' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('invalid priority');
    });

    it('should map expectedResults field from v1.1 format', async () => {
      const rows = [
        { title: 'Case with expected results', priority: 'medium', type: 'other', template: 'step', step: 'Step 1', expectedStepResult: 'Step result', expectedResults: 'Overall expected outcome', preConditions: 'Some precondition' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].expectedResults).toBe('Overall expected outcome');
      expect(res.body[0].preConditions).toBe('Some precondition');
      // Step-level result should be separate
      expect(createdSteps[0].result).toBe('Step result');
    });
  });

  // ──────────────────────────────────────────
  // Reference format tests
  // ──────────────────────────────────────────

  describe('reference format (single-cell multiline steps)', () => {
    it('should detect reference format and import cases with numbered steps', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-001',
          'Module': 'Login',
          'Test Scenario': 'Verify user can login with valid credentials',
          'Pre - Condition': 'User account exists',
          'Test Steps': '1. Open login page\n2. Enter username\n3. Enter password\n4. Click login',
          'Expected Result': 'User redirected to dashboard',
          'Comments': 'Smoke test',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=10')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);

      // Verify case fields
      const importedCase = res.body[0];
      expect(importedCase.title).toBe('Verify user can login with valid credentials');
      expect(importedCase.folderId).toBe(100); // Module 'Login' created as subfolder
      expect(importedCase.preConditions).toBe('User account exists');
      expect(importedCase.expectedResults).toBe('User redirected to dashboard');
      expect(importedCase.priority).toBe(2); // default medium = index 2
      expect(importedCase.type).toBe(0); // default other = index 0
      expect(importedCase.template).toBe(1); // step = index 1

      // Description should contain metadata
      expect(importedCase.description).toContain('TC-001');
      expect(importedCase.description).toContain('Login');
      expect(importedCase.description).toContain('Smoke test');

      // Verify 4 numbered steps were created (numbers stripped)
      expect(mockStep.create).toHaveBeenCalledTimes(4);
      expect(createdSteps[0].step).toBe('Open login page');
      expect(createdSteps[1].step).toBe('Enter username');
      expect(createdSteps[2].step).toBe('Enter password');
      expect(createdSteps[3].step).toBe('Click login');

      // Verify step numbers
      expect(createdCaseSteps[0].stepNo).toBe(1);
      expect(createdCaseSteps[1].stepNo).toBe(2);
      expect(createdCaseSteps[2].stepNo).toBe(3);
      expect(createdCaseSteps[3].stepNo).toBe(4);
    });

    it('should import multiple reference-format cases', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-001',
          'Test Scenario': 'First test scenario',
          'Test Steps': '1. Step A\n2. Step B',
          'Expected Result': 'Result 1',
        },
        {
          'Test Case ID': 'TC-002',
          'Test Scenario': 'Second test scenario',
          'Test Steps': '1. Step C\n2. Step D\n3. Step E',
          'Expected Result': 'Result 2',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(mockStep.create).toHaveBeenCalledTimes(5); // 2 + 3 steps
    });

    it('should handle reference format with non-numbered steps (plain lines)', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-010',
          'Test Scenario': 'Plain steps test',
          'Test Steps': 'Click the button\nVerify the modal\nClose the modal',
          'Expected Result': 'Modal closes',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(mockStep.create).toHaveBeenCalledTimes(3);
      expect(createdSteps[0].step).toBe('Click the button');
      expect(createdSteps[1].step).toBe('Verify the modal');
      expect(createdSteps[2].step).toBe('Close the modal');
    });

    it('should handle reference format with no steps (text template)', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-020',
          'Test Scenario': 'No steps test',
          'Expected Result': 'Something happens',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].template).toBe(0); // text = index 0 when no steps
      expect(mockStep.create).toHaveBeenCalledTimes(1); // placeholder empty step
      expect(createdSteps[0].step).toBe('');
    });

    it('should return 400 for reference format missing Test Scenario', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-099',
          'Test Steps': '1. Do thing',
          'Expected Result': 'Something',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('missing required field: Test Scenario');
    });

    it('should map Priority column from reference format', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-PRI',
          'Test Scenario': 'Priority mapping test',
          'Priority': 'critical',
          'Test Steps': '1. Check priority',
          'Expected Result': 'Priority is critical',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].priority).toBe(0); // critical = index 0
    });

    it('should default to medium for unknown priority in reference format', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-PRI2',
          'Test Scenario': 'Unknown priority test',
          'Priority': 'super-duper',
          'Test Steps': '1. Check default',
          'Expected Result': 'Defaults to medium',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].priority).toBe(2); // medium fallback = index 2
    });

    it('should build description from Test Case ID, Module, Test Data, and Comments', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-DESC',
          'Module': 'Registration',
          'Test Scenario': 'Description composition test',
          'Test Data': 'email: test@test.com',
          'Test Steps': '1. Fill form',
          'Expected Result': 'Form submitted',
          'Comments': 'Important test',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      const desc = res.body[0].description;
      expect(desc).toContain('Test Case ID: TC-DESC');
      expect(desc).toContain('Module: Registration');
      expect(desc).toContain('Test Data: email: test@test.com');
      expect(desc).toContain('Comments: Important test');
    });

    it('should map Expected Result as overall expectedResults alongside individual steps', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-ER',
          'Test Scenario': 'Expected result with steps',
          'Test Steps': '1. Open page\n2. Click button\n3. Submit form',
          'Expected Result': 'Form submission is successful and confirmation displayed',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      // Overall expected result on case
      expect(res.body[0].expectedResults).toBe('Form submission is successful and confirmation displayed');
      expect(res.body[0].template).toBe(1); // step template
      // Individual steps have empty results
      expect(mockStep.create).toHaveBeenCalledTimes(3);
      expect(createdSteps[0].result).toBe('');
      expect(createdSteps[1].result).toBe('');
      expect(createdSteps[2].result).toBe('');
    });

    it('should create module subfolder and assign cases to it', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-MOD1',
          'Module': 'Authentication',
          'Test Scenario': 'Login flow',
          'Test Steps': '1. Enter credentials',
          'Expected Result': 'User logged in',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=5')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      // Folder.findByPk was called to get parent folder's projectId
      expect(mockFolder.findByPk).toHaveBeenCalledWith('5');
      // Folder.findOrCreate was called for the module
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(1);
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: 'Authentication', parentFolderId: '5', projectId: 1 },
        })
      );
      // Case assigned to the module subfolder (id 100)
      expect(res.body[0].folderId).toBe(100);
    });

    it('should create separate folders for different modules', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-M1',
          'Module': 'Login',
          'Test Scenario': 'Login test',
          'Test Steps': '1. Login',
          'Expected Result': 'OK',
        },
        {
          'Test Case ID': 'TC-M2',
          'Module': 'Dashboard',
          'Test Scenario': 'Dashboard test',
          'Test Steps': '1. View dashboard',
          'Expected Result': 'OK',
        },
        {
          'Test Case ID': 'TC-M3',
          'Module': 'Login',
          'Test Scenario': 'Login validation',
          'Test Steps': '1. Invalid login',
          'Expected Result': 'Error shown',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=2')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      // findOrCreate called twice: once for Login, once for Dashboard
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(2);
      // Both Login cases share the same subfolder (id 100)
      expect(res.body[0].folderId).toBe(100);
      expect(res.body[2].folderId).toBe(100);
      // Dashboard case gets a different subfolder (id 101)
      expect(res.body[1].folderId).toBe(101);
    });

    it('should keep parent folderId for cases without Module column', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-NM1',
          'Test Scenario': 'No module test',
          'Test Steps': '1. Do something',
          'Expected Result': 'Done',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=7')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      // No module folder creation since no Module column
      expect(mockFolder.findOrCreate).not.toHaveBeenCalled();
      // Case stays in parent folder
      expect(res.body[0].folderId).toBe('7');
    });

    it('should handle mix of cases with and without Module column', async () => {
      const rows = [
        {
          'Test Case ID': 'TC-MIX1',
          'Module': 'Settings',
          'Test Scenario': 'Settings test',
          'Test Steps': '1. Open settings',
          'Expected Result': 'Settings page',
        },
        {
          'Test Case ID': 'TC-MIX2',
          'Test Scenario': 'General test',
          'Test Steps': '1. Do general',
          'Expected Result': 'Done',
        },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=3')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // First case with Module goes to subfolder
      expect(res.body[0].folderId).toBe(100);
      // Second case without Module stays in parent folder
      expect(res.body[1].folderId).toBe('3');
    });
  });

  // ──────────────────────────────────────────
  // Format auto-detection tests
  // ──────────────────────────────────────────

  describe('format auto-detection', () => {
    it('should detect v1.1 format when headers contain "title" but not reference columns', async () => {
      const rows = [
        { title: 'case A', priority: 'low', type: 'manual', template: 'text' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'v1.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('case A');
      expect(res.body[0].type).toBe(12); // manual = index 12
    });

    it('should detect reference format when headers contain "Test Scenario"', async () => {
      const rows = [
        { 'Test Scenario': 'Ref format case', 'Test Steps': '1. Do something', 'Expected Result': 'It works' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('Ref format case');
    });

    it('should detect reference format when headers contain "Test Case ID"', async () => {
      const rows = [
        { 'Test Case ID': 'TC-X', 'Test Scenario': 'ID detection test', 'Test Steps': '1. Test', 'Expected Result': 'Pass' },
      ];
      const buffer = buildXlsxBuffer(rows);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'ref.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('ID detection test');
    });
  });

  // ──────────────────────────────────────────
  // Multi-sheet import tests
  // ──────────────────────────────────────────

  describe('multi-sheet import', () => {
    it('should create a folder per sheet name and import all cases', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Login Tests': [
          { 'Test Scenario': 'Login success', 'Test Steps': '1. Enter creds', 'Expected Result': 'Logged in' },
        ],
        'Cart Tests': [
          { 'Test Scenario': 'Add to cart', 'Test Steps': '1. Click add', 'Expected Result': 'Item added' },
        ],
      });

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'multi.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // Sheet folders created: 'Login Tests' (id 100), 'Cart Tests' (id 101)
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Login Tests', parentFolderId: '1', projectId: 1 } })
      );
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Cart Tests', parentFolderId: '1', projectId: 1 } })
      );
      // Cases assigned to their sheet folders
      expect(res.body[0].folderId).toBe(100);
      expect(res.body[1].folderId).toBe(101);
    });

    it('should create module subfolders under sheet folders', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Regression': [
          {
            'Test Case ID': 'TC-R1',
            'Module': 'Auth',
            'Test Scenario': 'Auth regression',
            'Test Steps': '1. Test auth',
            'Expected Result': 'Pass',
          },
          {
            'Test Case ID': 'TC-R2',
            'Module': 'Payments',
            'Test Scenario': 'Payment regression',
            'Test Steps': '1. Test pay',
            'Expected Result': 'Pass',
          },
        ],
        'Smoke': [
          {
            'Test Case ID': 'TC-S1',
            'Test Scenario': 'Smoke test',
            'Test Steps': '1. Quick verify',
            'Expected Result': 'Pass',
          },
        ],
      });

      const res = await request(app)
        .post('/import?folderId=5')
        .attach('file', buffer, { filename: 'multi.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      // Sheet folders: 'Regression' (id 100), module Auth (101), Payments (102), then 'Smoke' (id 103)
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(4);
      // Sheet folders under parent
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Regression', parentFolderId: '5', projectId: 1 } })
      );
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Smoke', parentFolderId: '5', projectId: 1 } })
      );
      // Module folders under Regression sheet folder (id 100)
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Auth', parentFolderId: 100, projectId: 1 } })
      );
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Payments', parentFolderId: 100, projectId: 1 } })
      );
      // Regression cases assigned to module subfolders
      expect(res.body[0].folderId).toBe(101);
      expect(res.body[1].folderId).toBe(102);
      // Smoke case assigned to Smoke sheet folder (no module)
      expect(res.body[2].folderId).toBe(103);
    });

    it('should skip empty sheets in multi-sheet mode', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Has Data': [
          { 'Test Scenario': 'Test case', 'Test Steps': '1. Step', 'Expected Result': 'OK' },
        ],
        'Empty Sheet': [],
      });

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'multi.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      // Only folder for 'Has Data' created, not for empty sheet
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(1);
      expect(mockFolder.findOrCreate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: 'Has Data', parentFolderId: '1', projectId: 1 } })
      );
    });

    it('should support mixed formats across sheets', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Reference Sheet': [
          { 'Test Scenario': 'Ref case', 'Test Steps': '1. Do ref', 'Expected Result': 'Ref OK' },
        ],
        'V1 Sheet': [
          { title: 'V1 case', priority: 'high', type: 'functional', template: 'step', step: 'Do v1', expectedStepResult: 'V1 OK' },
        ],
      });

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'mixed.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // Sheet folders created for both
      expect(mockFolder.findOrCreate).toHaveBeenCalledTimes(2);
      expect(res.body[0].title).toBe('Ref case');
      expect(res.body[0].folderId).toBe(100); // Reference sheet folder
      expect(res.body[1].title).toBe('V1 case');
      expect(res.body[1].folderId).toBe(101); // V1 sheet folder
    });

    it('should accumulate steps correctly across multiple sheets', async () => {
      const buffer = buildMultiSheetXlsxBuffer({
        'Sheet A': [
          { 'Test Scenario': 'Case A', 'Test Steps': '1. Step A1\n2. Step A2', 'Expected Result': 'A OK' },
        ],
        'Sheet B': [
          { 'Test Scenario': 'Case B', 'Test Steps': '1. Step B1\n2. Step B2\n3. Step B3', 'Expected Result': 'B OK' },
        ],
      });

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'multi.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      // 2 steps from Sheet A + 3 steps from Sheet B = 5 total
      expect(mockStep.create).toHaveBeenCalledTimes(5);
      // Steps for case A (index 0): caseId 1
      expect(createdCaseSteps[0].caseId).toBe(1);
      expect(createdCaseSteps[1].caseId).toBe(1);
      // Steps for case B (index 1): caseId 2
      expect(createdCaseSteps[2].caseId).toBe(2);
      expect(createdCaseSteps[3].caseId).toBe(2);
      expect(createdCaseSteps[4].caseId).toBe(2);
    });

    it('should not create sheet folder for single-sheet file (backward compatible)', async () => {
      const buffer = buildXlsxBuffer([
        { 'Test Scenario': 'Single sheet case', 'Test Steps': '1. Step', 'Expected Result': 'OK' },
      ]);

      const res = await request(app)
        .post('/import?folderId=1')
        .attach('file', buffer, { filename: 'single.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      // No sheet folder created for single-sheet files
      expect(mockFolder.findOrCreate).not.toHaveBeenCalled();
      expect(res.body[0].folderId).toBe('1');
    });
  });
});
