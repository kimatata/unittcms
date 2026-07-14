import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import XLSX from 'xlsx';
import casesImportRoute from './import.js';

vi.mock('xlsx', () => ({
  default: {
    read: vi.fn(),
    utils: { sheet_to_json: vi.fn() },
  },
}));

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
    verifyProjectDeveloperFromFolderId: vi.fn((req, res, next) => next()),
  }),
}));

const mockCase = { belongsToMany: vi.fn(), belongsTo: vi.fn(), findAll: vi.fn(() => []) };
vi.mock('../../models/cases.js', () => ({ default: () => mockCase }));

const mockStep = { create: vi.fn(), belongsToMany: vi.fn() };
vi.mock('../../models/steps.js', () => ({ default: () => mockStep }));

const mockCaseStep = { create: vi.fn() };
vi.mock('../../models/caseSteps.js', () => ({ default: () => mockCaseStep }));

const mockFolder = { findByPk: vi.fn((id) => ({ id, projectId: 1, name: 'Target Folder' })) };
vi.mock('../../models/folders.js', () => ({ default: () => mockFolder }));

const FAKE_XLSX_BUFFER = Buffer.from('fake');
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const validRow = {
  title: 'Test Case',
  priority: 'medium',
  type: 'other',
  template: 'text',
};

describe('Test case import strict validation (preview)', () => {
  let app;

  beforeEach(() => {
    const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
    app = express();
    app.use(express.json());
    app.use('/', casesImportRoute(sequelize));
    vi.clearAllMocks();
  });

  const postPreview = (rows) => {
    XLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(rows);
    return request(app)
      .post('/import/preview?folderId=1')
      .attach('file', FAKE_XLSX_BUFFER, { filename: 'test.xlsx', contentType: XLSX_CONTENT_TYPE });
  };

  const firstCase = (res) => res.body.sheets[0].cases[0];

  describe('Happy path', () => {
    it('should tag a valid row as new', async () => {
      const res = await postPreview([{ ...validRow }]);
      expect(res.status).toBe(200);
      expect(firstCase(res).status).toBe('new');
    });
  });

  describe('Abnormal priority', () => {
    it('should flag "Medium" (wrong casing) as an error', async () => {
      const res = await postPreview([{ ...validRow, priority: 'Medium' }]);
      expect(res.status).toBe(200);
      const c = firstCase(res);
      expect(c.status).toBe('error');
      expect(c.errors[0]).toContain('invalid priority');
      expect(c.errors[0]).toContain('Medium');
    });

    it('should flag "HIGH" (all caps) as an error', async () => {
      const res = await postPreview([{ ...validRow, priority: 'HIGH' }]);
      expect(firstCase(res).errors[0]).toContain('invalid priority');
    });

    it('should flag a completely unknown priority value as an error', async () => {
      const res = await postPreview([{ ...validRow, priority: 'urgent' }]);
      expect(firstCase(res).errors[0]).toContain('invalid priority');
    });
  });

  describe('Invalid type', () => {
    it('should flag "Other" (wrong casing) as an error', async () => {
      const res = await postPreview([{ ...validRow, type: 'Other' }]);
      expect(firstCase(res).errors[0]).toContain('invalid type');
    });

    it('should flag a completely unknown type value as an error', async () => {
      const res = await postPreview([{ ...validRow, type: 'integration' }]);
      expect(firstCase(res).errors[0]).toContain('invalid type');
    });
  });

  describe('automationStatus field', () => {
    it('should flag "Automated" (wrong casing) as an error', async () => {
      const res = await postPreview([{ ...validRow, automationStatus: 'Automated' }]);
      expect(firstCase(res).errors[0]).toContain('invalid automationStatus');
    });

    it('should flag a completely unknown automationStatus value as an error', async () => {
      const res = await postPreview([{ ...validRow, automationStatus: 'unknown' }]);
      expect(firstCase(res).errors[0]).toContain('invalid automationStatus');
    });
  });

  describe('template field', () => {
    it('should flag "Text" (wrong casing) as an error', async () => {
      const res = await postPreview([{ ...validRow, template: 'Text' }]);
      expect(firstCase(res).errors[0]).toContain('invalid template');
    });

    it('should flag "Step" (wrong casing) as an error', async () => {
      const res = await postPreview([{ ...validRow, template: 'Step' }]);
      expect(firstCase(res).errors[0]).toContain('invalid template');
    });

    it('should flag a completely unknown template value as an error', async () => {
      const res = await postPreview([{ ...validRow, template: 'unknown' }]);
      expect(firstCase(res).errors[0]).toContain('invalid template');
    });
  });

  describe('error message should include the row number', () => {
    it('should report row 2 for the first data row', async () => {
      const res = await postPreview([{ ...validRow, priority: 'Medium' }]);
      expect(firstCase(res).errors[0]).toContain('Row 2');
    });

    it('should report row 3 for the second data row when first row is valid', async () => {
      const res = await postPreview([{ ...validRow }, { ...validRow, title: 'Another Case', priority: 'Medium' }]);
      expect(res.body.sheets[0].cases[1].errors[0]).toContain('Row 3');
      // and the first (valid) row still comes through as importable
      expect(res.body.sheets[0].cases[0].status).toBe('new');
    });
  });
});
