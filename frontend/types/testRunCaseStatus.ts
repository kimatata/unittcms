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

export type { TestRunCaseStatusUidType, TestRunCaseStatusType, TestRunCaseStatusMessages };
