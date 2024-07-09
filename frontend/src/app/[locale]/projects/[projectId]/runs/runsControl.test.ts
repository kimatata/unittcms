import { describe, expect, test } from 'vitest';
import { processRunCases } from './runsControl';
import { RunCaseType } from '@/types/run';

const initialRuncases: RunCaseType[] = [
  { id: 1, runId: 1, caseId: 1, editState: 'notChanged', status: 0 },
  { id: 2, runId: 1, caseId: 2, editState: 'notChanged', status: 0 },
  { id: 3, runId: 1, caseId: 3, editState: 'notChanged', status: 0 },
];

describe('runsControl', () => {
  test('Add test cases not yet included in the test run', () => {
    const isInclude = true;
    const keys: number[] = [4, 5];
    const runId = 1;
    const currentRunCases = [...initialRuncases];
    const newRunCases = processRunCases(isInclude, keys, runId, currentRunCases);

    expect(newRunCases).toStrictEqual([
      { id: 1, runId: 1, caseId: 1, editState: 'notChanged', status: 0 },
      { id: 2, runId: 1, caseId: 2, editState: 'notChanged', status: 0 },
      { id: 3, runId: 1, caseId: 3, editState: 'notChanged', status: 0 },
      { id: -1, runId: runId, caseId: 4, status: -1, editState: 'new' },
      { id: -1, runId: runId, caseId: 5, status: -1, editState: 'new' },
    ]);
  });

  test('Exclude test cases already included in the test run', () => {
    const isInclude = false;
    const keys: number[] = [1, 3];
    const runId = 1;
    const currentRunCases = [...initialRuncases];
    const newRunCases = processRunCases(isInclude, keys, runId, currentRunCases);

    expect(newRunCases).toStrictEqual([
      { id: 1, runId: 1, caseId: 1, editState: 'deleted', status: 0 },
      { id: 2, runId: 1, caseId: 2, editState: 'notChanged', status: 0 },
      { id: 3, runId: 1, caseId: 3, editState: 'deleted', status: 0 },
    ]);
  });
});
