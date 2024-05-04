type RunType = {
  id: number;
  name: string;
  configurations: number;
  description: string;
  state: number;
  projectId: number;
  createdAt: string;
  updatedAt: string;
};

type RunCaseType = {
  id: number;
  runId: number;
  caseId: number;
  status: number;
};

type RunCaseInfoType = {
  runId: number;
  caseId: number;
};

type RunStatusCountType = {
  status: number;
  count: number;
};

export type RunsMessages = {
  id: string;
  title: string;
  priority: string;
  status: string;
  actions: string;
  critical: string;
  high: string;
  medium: string;
  low: string;
  untested: string;
  passed: string;
  failed: string;
  retest: string;
  skipped: string;
  includeInRun: string;
  excludeFromRun: string;
  noCasesFound: string;
};

export {
  RunType,
  RunCaseType,
  RunCaseInfoType,
  RunStatusCountType,
  RunsMessages,
};
