type TestStatusUidType = 'untested' | 'passed' | 'failed' | 'retest' | 'skipped';

type TestStatusType = {
  uid: TestStatusUidType;
  color: string;
  chartColor: string;
};

type TestStatusMessages = {
  untested: string;
  passed: string;
  failed: string;
  retest: string;
  skipped: string;
};

export type { TestStatusUidType, TestStatusType, TestStatusMessages };
