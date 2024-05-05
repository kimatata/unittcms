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

type RunsMessages = {
  runs: string,
  id: string;
  name: string;
  description: string;
  lastUpdate: string;
  actions: string;
  newRun: string;
  deleteRun: string;
  noRunsFound: string;
};

type RunMessages = {
  backToRuns: string,
  updating: string;
  update: string;
  progress: string,
  refresh: string,
  id: string;
  title: string;
  pleaseEnter: string;
  description: string;
  new: string;
  inProgress: string;
  underReview: string;
  rejected: string;
  done: string;
  closed: string;
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
  selectTestCase: string;
  testCaseSelection: string;
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
  RunMessages,
};
