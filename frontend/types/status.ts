// The status of each test run
type RunStatusUidType = 'new' | 'inProgress' | 'underReview' | 'rejected' | 'done' | 'closed';

type RunStatusType = {
  uid: RunStatusUidType;
};

type RunStatusMessages = {
  new: string;
  inProgress: string;
  underReview: string;
  rejected: string;
  done: string;
  closed: string;
};

// The status of each test case in test run
type TestRunCaseStatusUidType = 'untested' | 'passed' | 'failed' | 'retest' | 'skipped';

type TestRunCaseStatusType = {
  uid: TestRunCaseStatusUidType;
  color: string;
  chartColor: string;
};

type TestRunCaseStatusMessages = {
  untested: string;
  passed: string;
  failed: string;
  retest: string;
  skipped: string;
};

export type {
  RunStatusUidType,
  RunStatusType,
  RunStatusMessages,
  TestRunCaseStatusUidType,
  TestRunCaseStatusType,
  TestRunCaseStatusMessages,
};
