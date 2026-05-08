import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import ciConfigsDeleteRoute from './delete.js';

vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => { req.userId = 1; next(); }),
  }),
}));
vi.mock('../../middleware/verifyEditable.js', () => ({
  default: () => ({
    verifyProjectManagerFromCiConfigId: vi.fn((req, res, next) => next()),
  }),
}));

const mockConfig = { findByPk: vi.fn() };
vi.mock('../../models/ciRepositoryConfig.js', () => ({ default: () => mockConfig }));

describe('DELETE /ci-configs/:configId', () => {
  let app;
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/ci-configs', ciConfigsDeleteRoute(sequelize));
    vi.clearAllMocks();
  });

  it('deletes config and returns 204', async () => {
    const destroy = vi.fn();
    mockConfig.findByPk.mockResolvedValue({ destroy });

    const res = await request(app).delete('/ci-configs/1');

    expect(res.status).toBe(204);
    expect(destroy).toHaveBeenCalled();
  });

  it('returns 404 if config not found', async () => {
    mockConfig.findByPk.mockResolvedValue(null);
    const res = await request(app).delete('/ci-configs/999');
    expect(res.status).toBe(404);
  });

  it('returns 500 on database error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockConfig.findByPk.mockRejectedValue(new Error('DB error'));
    const res = await request(app).delete('/ci-configs/1');
    expect(res.status).toBe(500);
  });
});
