// Enum string values extracted from selection.ts
// These are the uid values in the order they appear in the arrays
// Used by both frontend (selection.ts) and backend (CSV export)

export const testRunCaseStatusUids = ['untested', 'passed', 'failed', 'retest', 'skipped'];

export const testRunStatusUids = ['new', 'inProgress', 'underReview', 'rejected', 'done', 'closed'];

export const priorityUids = ['critical', 'high', 'medium', 'low'];

export const testTypeUids = [
  'other',
  'security',
  'performance',
  'accessibility',
  'functional',
  'acceptance',
  'usability',
  'smokeSanity',
  'compatibility',
  'destructive',
  'regression',
  'automated',
  'manual',
];

export const automationStatusUids = ['automated', 'automation-not-required', 'cannot-be-automated', 'obsolete'];

export const templateUids = ['text', 'step'];
