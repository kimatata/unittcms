// import { describe, it, expect, vi, beforeEach } from 'vitest';
// import request from 'supertest';
// import express from 'express';
// import updateRoute from './update';
// import { Sequelize } from 'sequelize';
// import { roles } from './authSettings';

// const adminRoleIndex = roles.findIndex((entry) => entry.uid === 'administrator');
// const userRoleIndex = roles.findIndex((entry) => entry.uid === 'user');

// // mock of authentication middleware
// const mockVerifySignedIn = (req, res, next) => {
//   req.headers['authorization'] = 'Bearer mockToken';
//   req.userId = 1;
//   next();
// };
// const mockVerifyAdmin = (req, res, next) => {
//   next();
// };

// // mock defineUser
// const mockUser = {
//   findByPk: vi.fn(),
//   count: vi.fn(),
//   update: vi.fn(),
// };
// vi.mock('../../models/users', () => ({
//   default: (sequelize, DataTypes) => mockUser,
// }));

// // test
// describe('updateUserRole', () => {
//   let app;
//   const sequelize = new Sequelize({
//     dialect: 'sqlite',
//     logging: false,
//   });

//   beforeEach(() => {
//     app = express();
//     app.use(express.json());

//     // Use mocked middlewares before the route
//     app.use(mockVerifySignedIn);
//     app.use(mockVerifyAdmin);

//     // Mount the update route
//     app.use('/users', updateRoute(sequelize));
//   });

//   it('promote not existing user to admin will return 404', async () => {
//     mockUser.findByPk.mockResolvedValue(null); // No user found
//     const response = await request(app).put('/users/2').send({
//       newRole: 0,
//     });
//     expect(response.status).toBe(404);
//   });

//   it('promote existing user to admin will retunr 200', async () => {
//     const targetUser = { id: 2, role: userRoleIndex, update: vi.fn() }; // Normal user
//     mockUser.findByPk.mockResolvedValue(targetUser);
//     mockUser.count.mockResolvedValue(1);

//     const response = await request(app).put('/users/2').send({
//       newRole: 0,
//     }); // Promote user to admin

//     expect(response.status).toBe(200);
//     expect(mockUser.update).toHaveBeenCalledWith({ role: 0 });
//   });

//   it('should update user role and return json without redirect if another user is updated', async () => {
//     const targetUser = { id: 2, role: userRoleIndex, update: vi.fn() }; // Normal user
//     mockUser.findByPk.mockResolvedValue(targetUser);
//     mockUser.count.mockResolvedValue(2); // Multiple admins exist

//     const response = await request(app).put('/users/2').send({
//       newRole: 0,
//     }); // Promote user to admin

//     expect(response.status).toBe(200);
//     expect(mockUser.update).toHaveBeenCalledWith({ role: 0 });
//   });

//   it('should return 400 if trying to demote the only administrator', async () => {
//     const targetUser = { id: 1, role: adminRoleIndex, update: vi.fn() }; // Administrator
//     mockUser.findByPk.mockResolvedValue(targetUser);
//     mockUser.count.mockResolvedValue(1); // Only one admin

//     const response = await request(app).put('/users/1').send({
//       newRole: 1,
//     }); // Downgrading admin to user

//     expect(response.status).toBe(400);
//   });

//   it('should handle internal server errors', async () => {
//     mockUser.findByPk.mockRejectedValue(new Error('Database error')); // Simulate DB error

//     const response = await request(app).put('/users/1').send({
//       newRole: 0,
//     });

//     expect(response.status).toBe(500);
//   });
// });
