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
  editState: 'notChanged' | 'changed' | 'new' | 'deleted';
};

type RunStatusCountType = {
  status: number;
  count: number;
};

type ProgressSeriesType = {
  name: string;
  data: number[];
};

type RunsMessages = {
  runList: string;
  run: string;
  newRun: string;
  editRun: string;
  deleteRun: string;
  id: string;
  name: string;
  description: string;
  lastUpdate: string;
  actions: string;
  runName: string;
  runDescription: string;
  close: string;
  create: string;
  update: string;
  pleaseEnter: string;
  noRunsFound: string;
  areYouSure: string;
  delete: string;
};

type RunMessages = {
  backToRuns: string;
  updating: string;
  update: string;
  progress: string;
  refresh: string;
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
  areYouSureLeave: string;
  type: string;
  other: string;
  security: string;
  performance: string;
  accessibility: string;
  functional: string;
  acceptance: string;
  usability: string;
  smokeSanity: string;
  compatibility: string;
  destructive: string;
  regression: string;
  automated: string;
  manual: string;
  preconditions: string;
  expectedResult: string;
  detailsOfTheStep: string;
  close: string;
};

export type { RunType, RunCaseType, RunStatusCountType, ProgressSeriesType, RunsMessages, RunMessages };
