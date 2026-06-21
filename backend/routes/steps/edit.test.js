import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import stepEditRoute from './edit';

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
    verifyProjectDeveloperFromCaseId: vi.fn((req, res, next) => {
      next();
    }),
  }),
}));

const mockStep = { create: vi.fn(), update: vi.fn(), destroy: vi.fn() };
const mockCaseStep = { create: vi.fn(), update: vi.fn(), destroy: vi.fn(), findAll: vi.fn() };

vi.mock('../../models/steps.js', () => ({ default: () => mockStep }));
vi.mock('../../models/caseSteps.js', () => ({ default: () => mockCaseStep }));

describe('POST /steps/update', () => {
  let app;
  let sequelize;
  let transactionMock;

  beforeEach(() => {
    transactionMock = { commit: vi.fn(), rollback: vi.fn() };
    sequelize = new Sequelize({ dialect: 'sqlite', logging: false });
    sequelize.transaction = vi.fn().mockResolvedValue(transactionMock);

    app = express();
    app.use(express.json());
    app.use('/steps', stepEditRoute(sequelize));

    vi.clearAllMocks();
  });

  it('should create a new step when editState is "new"', async () => {
    const mockStepId = 3;
    mockCaseStep.findAll.mockResolvedValue([]);
    mockStep.create.mockResolvedValue({ id: mockStepId });
    mockCaseStep.create.mockResolvedValue({});

    const payload = [
      {
        step: 'new step',
        result: 'new result',
        editState: 'new',
        caseSteps: { stepNo: 1 },
      },
    ];

    const res = await request(app).post('/steps/update?caseId=1').send(payload);
    expect(res.status).toBe(200);

    const [stepCreateData, stepCreateOptions] = mockStep.create.mock.calls[0];
    expect(stepCreateData).toEqual({
      step: 'new step',
      result: 'new result',
    });
    expect(stepCreateOptions.transaction).toBeDefined();

    const [caseStepCreateData, caseStepCreateOptions] = mockCaseStep.create.mock.calls[0];
    expect(caseStepCreateData).toEqual({
      caseId: 1,
      stepId: mockStepId,
      stepNo: 1,
    });
    expect(caseStepCreateOptions.transaction).toBeDefined();
  });

  it('should update a step when editState is "changed"', async () => {
    mockCaseStep.findAll.mockResolvedValue([]);
    mockStep.update.mockResolvedValue([1]);
    mockCaseStep.update.mockResolvedValue([1]);

    const payload = [
      {
        id: 50,
        step: 'updated step',
        result: 'updated result',
        editState: 'changed',
        caseSteps: { stepNo: 2 },
      },
    ];

    const res = await request(app).post('/steps/update?caseId=1').send(payload);
    expect(res.status).toBe(200);

    const [stepUpdateData, stepUpdateOptions] = mockStep.update.mock.calls[0];
    expect(stepUpdateData).toEqual({ step: 'updated step', result: 'updated result' });
    expect(stepUpdateOptions.where).toEqual({ id: 50 });
    expect(stepUpdateOptions.transaction).toBeDefined();

    const [caseStepUpdateData, caseStepUpdateOptions] = mockCaseStep.update.mock.calls[0];
    expect(caseStepUpdateData).toEqual({ stepNo: 2 });
    expect(caseStepUpdateOptions.where).toEqual({ caseId: 1, stepId: 50 });
    expect(caseStepUpdateOptions.transaction).toBeDefined();
  });

  it('should not call create or update when editState is "notChanged"', async () => {
    mockCaseStep.findAll.mockResolvedValue([{ stepId: 99 }]);

    const payload = [
      {
        id: 99,
        step: 'same step',
        result: 'same result',
        editState: 'notChanged',
        caseSteps: { stepNo: 1 },
      },
    ];

    const res = await request(app).post('/steps/update?caseId=1').send(payload);

    expect(res.status).toBe(200);
    expect(mockStep.create).not.toHaveBeenCalled();
    expect(mockStep.update).not.toHaveBeenCalled();
    expect(mockStep.destroy).not.toHaveBeenCalled();
    expect(mockCaseStep.destroy).not.toHaveBeenCalled();

    expect(res.body[0]).toEqual({
      id: 99,
      step: 'same step',
      result: 'same result',
      caseSteps: { stepNo: 1 },
      editState: 'notChanged',
    });
  });

  it('should handle mixed payload (new + changed + notChanged)', async () => {
    const mockStepId = 22;
    mockCaseStep.findAll.mockResolvedValue([{ stepId: 10 }, { stepId: 11 }]);

    mockStep.create.mockResolvedValue({ id: mockStepId });
    mockCaseStep.create.mockResolvedValue({});
    mockStep.update.mockResolvedValue([1]);
    mockCaseStep.update.mockResolvedValue([1]);

    const payload = [
      { step: 'new step', result: 'new result', editState: 'new', caseSteps: { stepNo: 1 } },
      { id: 10, step: 'updated step', result: 'updated result', editState: 'changed', caseSteps: { stepNo: 2 } },
      { id: 11, step: 'same step', result: 'same result', editState: 'notChanged', caseSteps: { stepNo: 3 } },
    ];

    const res = await request(app).post('/steps/update?caseId=1').send(payload);
    expect(res.status).toBe(200);

    expect(mockStep.create).toHaveBeenCalledTimes(1);
    expect(mockStep.update).toHaveBeenCalledTimes(1);

    // state 'new'
    const [stepCreateData, stepCreateOptions] = mockStep.create.mock.calls[0];
    expect(stepCreateData).toEqual({ step: 'new step', result: 'new result' });
    expect(stepCreateOptions.transaction).toBeDefined();

    const [caseStepCreateData, caseStepCreateOptions] = mockCaseStep.create.mock.calls[0];
    expect(caseStepCreateData).toEqual({ caseId: 1, stepId: mockStepId, stepNo: 1 });
    expect(caseStepCreateOptions.transaction).toBeDefined();

    // state 'changed'
    const [stepUpdateData, stepUpdateOptions] = mockStep.update.mock.calls[0];
    expect(stepUpdateData).toEqual({ step: 'updated step', result: 'updated result' });
    expect(stepUpdateOptions.where).toEqual({ id: 10 });
    expect(stepUpdateOptions.transaction).toBeDefined();

    const [caseStepUpdateData, caseStepUpdateOptions] = mockCaseStep.update.mock.calls[0];
    expect(caseStepUpdateData).toEqual({ stepNo: 2 });
    expect(caseStepUpdateOptions.where).toEqual({ caseId: 1, stepId: 10 });
    expect(caseStepUpdateOptions.transaction).toBeDefined();
  });

  it('should delete removed steps', async () => {
    mockCaseStep.findAll.mockResolvedValue([{ stepId: 1 }, { stepId: 2 }]);

    const payload = [{ id: 1, editState: 'notChanged', caseSteps: { stepNo: 1 } }];

    const res = await request(app).post('/steps/update?caseId=1').send(payload);
    expect(res.status).toBe(200);

    const [caseStepDestroyOptions] = mockCaseStep.destroy.mock.calls[0];
    expect(caseStepDestroyOptions.where).toEqual({ caseId: 1, stepId: 2 });
    expect(caseStepDestroyOptions.transaction).toBeDefined();

    const [stepDestroyOptions] = mockStep.destroy.mock.calls[0];
    expect(stepDestroyOptions.where).toEqual({ id: 2 });
    expect(stepDestroyOptions.transaction).toBeDefined();
  });
});
