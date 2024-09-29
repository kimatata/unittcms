import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import updateRoute from './update';
import { Sequelize } from 'sequelize';
import { roles } from './authSettings';

const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
const userRoleIndex = roles.findIndex((entry) => entry.uid === 'user');

// mock of authentication middleware
vi.mock('../../middleware/auth', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => {
      req.userId = 1; // Mock user ID
      next();
    }),
    verifyAdmin: vi.fn((req, res, next) => {
      next(); // Allow all as admin
    }),
  }),
}));

// mock defineUser
const mockUser = {
  findByPk: vi.fn(),
  count: vi.fn(),
  update: vi.fn(),
};
vi.mock('../../models/users', () => ({
  default: (sequelize, DataTypes) => mockUser,
}));

// test
describe('updateUserRole', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount the update route
    app.use('/users', updateRoute(sequelize));
  });

  it('call update API without new role', async () => {
    const response = await request(app).put('/users/2').send();

    expect(response.status).toBe(400);
    expect(response.text).toBe('newRole is required');
  });

  it('promote not existing user to admin will return 404', async () => {
    mockUser.findByPk.mockResolvedValue(null); // No user found
    const response = await request(app).put('/users/2').send({
      newRole: 0,
    });

    expect(response.status).toBe(404);
    expect(response.text).toBe('User not found');
  });

  it('promote existing user to admin will return 200', async () => {
    const targetUser = { id: 2, role: userRoleIndex, update: vi.fn() }; // Normal user
    mockUser.findByPk.mockResolvedValue(targetUser);

    const response = await request(app).put('/users/2').send({
      newRole: 0,
    });

    expect(response.status).toBe(200);
    expect(targetUser.update).toHaveBeenCalledWith({ role: 0 });
  });

  it('should return 400 if trying to demote the only administrator', async () => {
    const targetUser = { id: 1, role: adminRoleIndex, update: vi.fn() }; // Administrator
    mockUser.findByPk.mockResolvedValue(targetUser);
    mockUser.count.mockResolvedValue(1); // Only one admin

    const response = await request(app).put('/users/1').send({
      newRole: 1,
    }); // Downgrading admin to user

    expect(response.status).toBe(400);
    expect(response.text).toBe('At least one administrator is required.');
  });

  it('should handle internal server errors', async () => {
    // Suppress error logging to console
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Simulate DB error
    mockUser.findByPk.mockRejectedValue(new Error('Database error'));

    const response = await request(app).put('/users/1').send({
      newRole: 0,
    });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Internal Server Error');
  });
});
