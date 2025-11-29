import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import casesDownloadRoute from './download.js';

// mock papaparse
vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn((data) => {
      // Simple CSV generation for testing
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => `"${row[h]}"`).join(','));
      return [headers.join(','), ...rows].join('\n');
    }),
  },
}));

// mock of authentication middleware
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
    verifyProjectVisibleFromFolderId: vi.fn((req, res, next) => {
      next();
    }),
  }),
}));

// mock defineCase
const mockCase = {
  findAll: vi.fn(),
  belongsToMany: vi.fn(),
  belongsTo: vi.fn(),
};
vi.mock('../../models/cases.js', () => ({
  default: () => mockCase,
}));

const mockStep = {
  belongsToMany: vi.fn(),
};
vi.mock('../../models/steps.js', () => ({
  default: () => mockStep,
}));

describe('GET /download with type=csv', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', casesDownloadRoute(sequelize));
    vi.clearAllMocks();
  });

  it('should return CSV with human-readable labels for state, priority, type, automationStatus, and template', async () => {
    mockCase.findAll.mockResolvedValue([
      {
        id: 1,
        title: 'Test Case 1',
        state: 0, // new
        priority: 0, // critical
        type: 4, // functional
        automationStatus: 0, // automated
        template: 1, // step
        description: 'Test description',
        preConditions: 'Test preconditions',
        expectedResults: 'Test expected results',
        folderId: 1,
      },
      {
        id: 2,
        title: 'Test Case 2',
        state: 1, // inProgress
        priority: 1, // high
        type: 1, // security
        automationStatus: 1, // automation-not-required
        template: 0, // text
        description: 'Test description 2',
        preConditions: 'Test preconditions 2',
        expectedResults: 'Test expected results 2',
        folderId: 1,
      },
      {
        id: 3,
        title: 'Test Case 3',
        state: 2, // underReview
        priority: 2, // medium
        type: 2, // performance
        automationStatus: 2, // cannot-be-automated
        template: 1, // step
        description: 'Test description 3',
        preConditions: 'Test preconditions 3',
        expectedResults: 'Test expected results 3',
        folderId: 1,
      },
    ]);

    const response = await request(app).get('/download?folderId=1&type=csv');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toBe('attachment; filename=cases_folder_1.csv');

    const csvContent = response.text;

    // Check that the CSV contains human-readable labels instead of numeric values
    expect(csvContent).toContain('critical');
    expect(csvContent).toContain('high');
    expect(csvContent).toContain('medium');
    expect(csvContent).toContain('functional');
    expect(csvContent).toContain('security');
    expect(csvContent).toContain('performance');
    expect(csvContent).toContain('automated');
    expect(csvContent).toContain('automation-not-required');
    expect(csvContent).toContain('cannot-be-automated');
    expect(csvContent).toContain('new');
    expect(csvContent).toContain('inProgress');
    expect(csvContent).toContain('underReview');
    expect(csvContent).toContain('text');
    expect(csvContent).toContain('step');
  });

  it('should return 404 if no cases found', async () => {
    mockCase.findAll.mockResolvedValue([]);

    const response = await request(app).get('/download?folderId=999&type=csv');

    expect(response.status).toBe(404);
    expect(response.text).toBe('No cases found');
  });

  it('should return 400 if folderId is missing', async () => {
    const response = await request(app).get('/download?type=csv');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('folderId is required');
  });

  it('should return 400 if type is missing', async () => {
    const response = await request(app).get('/download?folderId=1');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('download type is required');
  });
});
