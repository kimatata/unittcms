import { describe, expect, test, assert } from 'vitest';
import { changeStatus, includeExcludeTestCases } from './runsControl';
import { CaseType } from '@/types/case';

const sampleTestCase: CaseType = {
  id: 1,
  title: '',
  state: 0,
  priority: 0,
  type: 0,
  automationStatus: 0,
  description: '',
  template: 0,
  preConditions: '',
  expectedResults: '',
  folderId: 1,
};

const initialTestCases: CaseType[] = [
  {
    ...sampleTestCase,
    id: 1,
    RunCases: [
      {
        id: 1,
        runId: 1,
        caseId: 1,
        status: 0,
        editState: 'notChanged',
      },
    ],
  },
  {
    ...sampleTestCase,
    id: 2,
    RunCases: [
      {
        id: 2,
        runId: 1,
        caseId: 2,
        status: 0,
        editState: 'notChanged',
      },
    ],
  },
  {
    ...sampleTestCase,
    id: 3,
    RunCases: [],
  },
];

describe('runsControl', () => {
  test('Exclude test cases already included in the test run', () => {
    const changeCaseId = 1;
    const newStatus = 1;
    const currentRunCases = [...initialTestCases];
    const newTestCases = changeStatus(changeCaseId, newStatus, currentRunCases);

    if (newTestCases[0] && newTestCases[0].RunCases && newTestCases[0].RunCases[0]) {
      expect(newTestCases[0].RunCases[0].status).toBe(1);
      expect(newTestCases[0].RunCases[0].editState).toBe('changed');
    } else {
      assert.fail("RunCases isn't exist");
    }
  });

  test('include test case', () => {
    const isInclude = true;
    const keys: number[] = [3];
    const runId = 1;
    const currentRunCases = [...initialTestCases];
    const newTestCases = includeExcludeTestCases(isInclude, keys, runId, currentRunCases);

    if (newTestCases[2] && newTestCases[2].RunCases && newTestCases[2].RunCases[0]) {
      expect(newTestCases[2].RunCases[0].editState).toBe('new');
    } else {
      assert.fail("RunCases isn't exist");
    }
  });

  test('Exclude test cases which already included', () => {
    const isInclude = false;
    const keys: number[] = [1, 3];
    const runId = 1;
    const currentRunCases = [...initialTestCases];
    const newTestCases = includeExcludeTestCases(isInclude, keys, runId, currentRunCases);

    if (newTestCases[0] && newTestCases[0].RunCases && newTestCases[0].RunCases[0]) {
      expect(newTestCases[0].RunCases[0].editState).toBe('deleted');
    } else {
      assert.fail("RunCases isn't exist");
    }

    if (newTestCases[2] && newTestCases[2].RunCases && newTestCases[2].RunCases[0]) {
      expect(newTestCases[2].RunCases[0].editState).toBe('deleted');
    } else {
      assert.fail("RunCases isn't exist");
    }
  });
});
