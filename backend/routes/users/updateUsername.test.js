import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import updateUsernameRoute from './updateUsername.js';

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

describe('User Profile Routes', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', updateUsernameRoute(sequelize));

    // Reset mock users
    mockUsers.clear();
    mockUserId = 1;

    // Create a test user
    mockUsers.set(1, {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      password: '',
      role: 1,
      avatarPath: null,
    });

    vi.clearAllMocks();
  });

  it('should update username', async () => {
    const newUsername = 'updatedusername';
    const response = await request(app).put('/users/username').send({ username: newUsername });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe(newUsername);
  });

  it('should reject empty username', async () => {
    const response = await request(app).put('/users/username').send({ username: '' });

    expect(response.status).toBe(400);
  });

  it('should reject whitespace-only username', async () => {
    const response = await request(app).put('/users/username').send({ username: '   ' });

    expect(response.status).toBe(400);
  });
});
