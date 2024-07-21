type TestTypeUidType =
  | 'other'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'functional'
  | 'acceptance'
  | 'usability'
  | 'smokeSanity'
  | 'compatibility'
  | 'destructive'
  | 'regression'
  | 'automated'
  | 'manual';

type TestTypeType = {
  uid: TestTypeUidType;
  chartColor: string;
};

type TestTypeMessages = {
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
};

export type { TestTypeUidType, TestTypeType, TestTypeMessages };
