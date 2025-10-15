import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize, Op } from 'sequelize';
import casesIndexRoute from './index';

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
};

vi.mock('../../models/cases.js', () => ({
  default: () => mockCase,
}));

const mockTags = {
  belongsToMany: vi.fn(),
};
vi.mock('../../models/tags.js', () => ({
  default: () => mockTags,
}));

describe('GET /cases', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount the index route
    app.use('/cases', casesIndexRoute(sequelize));
  });

  it('should return 400 if folderId is missing', async () => {
    const res = await request(app).get('/cases');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('folderId is required');
  });

  it('should call findAll with correct where clause for folderId only', async () => {
    mockCase.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await request(app).get('/cases?folderId=1');
    expect(res.status).toBe(200);
    expect(mockCase.findAll).toHaveBeenCalledWith({
      where: { folderId: '1' },
      include: [
        {
          model: mockTags,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it('should build a where clause based on query parameters.', async () => {
    mockCase.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await request(app).get('/cases?folderId=1&priority=1,2&type=3');
    expect(res.status).toBe(200);

    expect(mockCase.findAll).toHaveBeenCalledWith({
      where: {
        folderId: '1',
        priority: { [Op.in]: [1, 2] },
        type: { [Op.in]: [3] },
      },
      include: [
        {
          model: mockTags,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
    });
  });
});
