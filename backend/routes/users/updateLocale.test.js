import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import { SUPPORTED_LOCALES } from '../../config/locale.js';
import updateLocaleRoute from './updateLocale.js';

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

describe('User Locale Routes', () => {
  let app;
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    logging: false,
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/users', updateLocaleRoute(sequelize));

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
      locale: null,
    });

    vi.clearAllMocks();
  });

  it('should update locale', async () => {
    const newLocale = SUPPORTED_LOCALES[0];
    const response = await request(app).put('/users/locale').send({ locale: newLocale });

    expect(response.status).toBe(200);
    expect(response.body.user.locale).toBe(newLocale);
  });

  it('should replace existing locale', async () => {
    mockUsers.set(1, {
      locale: SUPPORTED_LOCALES[0],
    });
    const response = await request(app).put('/users/locale').send({ locale: SUPPORTED_LOCALES[1] });

    expect(response.status).toBe(200);
    expect(response.body.user.locale).toBe(SUPPORTED_LOCALES[1]);
  });

  it.each([' ', 'chinese', 'english'])('should reject not supported locale: %s', async (locale) => {
    const response = await request(app).put('/users/locale').send({ locale });

    expect(response.status).toBe(400);
  });
});
