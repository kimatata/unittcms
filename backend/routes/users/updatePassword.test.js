import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import updatePasswordRoute from './updatePassword.js';

// mock of authentication middleware
let mockUserId = 1;
vi.mock('../../middleware/auth.js', () => ({
  default: () => ({
    verifySignedIn: vi.fn((req, res, next) => {
      req.userId = mockUserId; // Mock user ID
      next();
    }),
  }),
}));

// mock defineUser
const mockUsers = new Map();
const mockUser = {
  findByPk: vi.fn((id) => {
    const user = mockUsers.get(id);
    if (!user) return null;
    return {
      ...user,
      update: vi.fn(async (data) => {
        Object.assign(user, data);
        return user;
      }),
    };
  }),
};

vi.mock('../../models/users.js', () => ({
  default: () => mockUser,
}));

// mock bcrypt (just add 'hashed_' prefix)
vi.mock('bcrypt', () => ({
  default: {
    hashSync: (pw) => `hashed_${pw}`,
    compareSync: (pw, hashed) => hashed === `hashed_${pw}`,
    hash: async (pw) => `hashed_${pw}`,
    compare: async (pw, hashed) => hashed === `hashed_${pw}`,
  },
}));

describe('User Profile Routes', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', updatePasswordRoute(sequelize));

    // Reset mock users
    mockUsers.clear();
    mockUserId = 1;

    // Create a test user
    mockUsers.set(1, {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: 'hashed_testpassword123',
      role: 1,
      avatarPath: null,
    });

    vi.clearAllMocks();
  });

  it('should update password', async () => {
    const newPassword = 'newpassword123';
    const response = await request(app).put('/users/password').send({
      currentPassword: 'testpassword123',
      newPassword: newPassword,
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('successfully');
  });

  it('should reject incorrect current password', async () => {
    const response = await request(app).put('/users/password').send({
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword456',
    });

    expect(response.status).toBe(401);
  });

  it('should reject password shorter than 8 characters', async () => {
    const response = await request(app).put('/users/password').send({
      currentPassword: 'testpassword123',
      newPassword: 'short',
    });

    expect(response.status).toBe(400);
  });

  it('should reject missing current password', async () => {
    const response = await request(app).put('/users/password').send({
      newPassword: 'newpassword123',
    });

    expect(response.status).toBe(400);
  });
});
