import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import invitationsNewRoute from './new.js';
import invitationsAcceptRoute from './accept.js';
import invitationsShowRoute from './show.js';
import { isUsable } from './shared.js';
import { defaultDangerKey } from '../users/authSettings.js';

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
    verifyProjectManagerFromProjectId: vi.fn((req, res, next) => next()),
  }),
}));

const mockInvitation = { create: vi.fn(), findOne: vi.fn() };
vi.mock('../../models/invitations.js', () => ({ default: () => mockInvitation }));

const mockMember = { create: vi.fn(), findOne: vi.fn() };
vi.mock('../../models/members.js', () => ({ default: () => mockMember }));

const mockUser = { create: vi.fn(), findOne: vi.fn() };
vi.mock('../../models/users.js', () => ({ default: () => mockUser }));

const mockProject = { findByPk: vi.fn() };
vi.mock('../../models/projects.js', () => ({ default: () => mockProject }));

const REPORTER_ROLE = 2;
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000);
const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);

function makeApp() {
  const app = express();
  app.use(express.json());
  const sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
  app.use('/invitations', invitationsNewRoute(sequelize));
  app.use('/invitations', invitationsAcceptRoute(sequelize));
  app.use('/invitations', invitationsShowRoute(sequelize));
  return app;
}

const openInvitation = (overrides = {}) => ({
  id: 7,
  token: 'a-token',
  projectId: 3,
  role: REPORTER_ROLE,
  email: null,
  expiresAt: TOMORROW,
  acceptedAt: null,
  update: vi.fn(),
  ...overrides,
});

describe('project invitations', () => {
  let app;

  beforeEach(() => {
    app = makeApp();
    vi.clearAllMocks();
    mockMember.findOne.mockResolvedValue(null);
    mockUser.findOne.mockResolvedValue(null);
    mockProject.findByPk.mockResolvedValue({ id: 3, name: 'Recette' });
  });

  describe('isUsable', () => {
    it('refuses an invitation that was already taken', () => {
      expect(isUsable({ acceptedAt: new Date(), expiresAt: TOMORROW })).toBe(false);
    });

    it('refuses an invitation past its date', () => {
      expect(isUsable({ acceptedAt: null, expiresAt: YESTERDAY })).toBe(false);
    });

    it('accepts an open one', () => {
      expect(isUsable({ acceptedAt: null, expiresAt: TOMORROW })).toBe(true);
    });
  });

  it('mints a long random token nobody can guess', async () => {
    mockInvitation.create.mockResolvedValue({ id: 1 });

    await request(app).post('/invitations?projectId=3').send({ role: REPORTER_ROLE });

    const { token } = mockInvitation.create.mock.calls[0][0];
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses a role that is not a member role', async () => {
    const res = await request(app).post('/invitations?projectId=3').send({ role: 9 });

    expect(res.status).toBe(400);
    expect(mockInvitation.create).not.toHaveBeenCalled();
  });

  it('shows an invited stranger who is inviting, and to do what', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation());

    const res = await request(app).get('/invitations/a-token');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ projectName: 'Recette', role: REPORTER_ROLE });
    expect(res.body.token).toBeUndefined();
  });

  it('says nothing about a spent invitation', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation({ acceptedAt: new Date() }));

    const res = await request(app).get('/invitations/a-token');

    expect(res.status).toBe(404);
  });

  it('creates the account and seats it at the role the invitation carries', async () => {
    const invitation = openInvitation();
    mockInvitation.findOne.mockResolvedValue(invitation);
    mockUser.create.mockResolvedValue({ id: 42 });

    const res = await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'tester@example.com', username: 'tester', password: 'longenough' });

    expect(res.status).toBe(200);
    expect(mockMember.create).toHaveBeenCalledWith({ userId: 42, projectId: 3, role: REPORTER_ROLE });
    expect(res.body.access_token).toBeDefined();
  });

  it('never lets an invitation mint an administrator', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation());
    mockUser.create.mockResolvedValue({ id: 42 });

    await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'tester@example.com', username: 'tester', password: 'longenough', role: 0 });

    // L'index 1 de `roles` est « user » ; 0 serait « administrator ».
    expect(mockUser.create).toHaveBeenCalledWith(expect.objectContaining({ role: 1 }));
  });

  it('seats a signed-in account without asking it to sign up again', async () => {
    const invitation = openInvitation();
    mockInvitation.findOne.mockResolvedValue(invitation);
    const token = jwt.sign({ userId: 99 }, process.env.SECRET_KEY || defaultDangerKey);

    const res = await request(app).post('/invitations/a-token/accept').set('Authorization', `Bearer ${token}`).send({});

    expect(res.status).toBe(200);
    expect(mockUser.create).not.toHaveBeenCalled();
    expect(mockMember.create).toHaveBeenCalledWith({ userId: 99, projectId: 3, role: REPORTER_ROLE });
  });

  it('refuses to merge two identities on a matching address', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation());
    mockUser.findOne.mockResolvedValue({ id: 5 });

    const res = await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'taken@example.com', username: 'tester', password: 'longenough' });

    expect(res.status).toBe(409);
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('refuses a password too short to be one', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation());

    const res = await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'tester@example.com', username: 'tester', password: 'short' });

    expect(res.status).toBe(400);
    expect(mockUser.create).not.toHaveBeenCalled();
  });

  it('spends the invitation once the seat is taken', async () => {
    const invitation = openInvitation();
    mockInvitation.findOne.mockResolvedValue(invitation);
    mockUser.create.mockResolvedValue({ id: 42 });

    await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'tester@example.com', username: 'tester', password: 'longenough' });

    expect(invitation.update).toHaveBeenCalledWith({ acceptedAt: expect.any(Date) });
  });

  it('leaves an expired link unusable', async () => {
    mockInvitation.findOne.mockResolvedValue(openInvitation({ expiresAt: YESTERDAY }));

    const res = await request(app)
      .post('/invitations/a-token/accept')
      .send({ email: 'tester@example.com', username: 'tester', password: 'longenough' });

    expect(res.status).toBe(404);
    expect(mockMember.create).not.toHaveBeenCalled();
  });
});
