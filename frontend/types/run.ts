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

export { RunType, RunCaseType, RunCaseInfoType, RunStatusCountType };
