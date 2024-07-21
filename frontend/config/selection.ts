import { TestTypeType } from '@/types/testType';
import { PriorityType } from '@/types/priority';

const roles = [{ uid: 'administrator' }, { uid: 'user' }];

const memberRoles = [{ uid: 'manager' }, { uid: 'developer' }, { uid: 'reporter' }];

const categoricalPalette = ['#fba91e', '#6ea56c', '#3ac6e1', '#feda2f', '#f15f47', '#244470', '#9c80bb', '#f595a6'];

const locales = [
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
];

const priorities: PriorityType[] = [
  { uid: 'critical', color: '#bb3e03', chartColor: '#bb3e03' },
  { uid: 'high', color: '#ca6702', chartColor: '#ca6702' },
  { uid: 'medium', color: '#ee9b00', chartColor: '#ee9b00' },
  { uid: 'low', color: '#94d2bd', chartColor: '#94d2bd' },
];

const testTypes: TestTypeType[] = [
  { uid: 'other', chartColor: categoricalPalette[0] },
  { uid: 'security', chartColor: categoricalPalette[1] },
  { uid: 'performance', chartColor: categoricalPalette[2] },
  { uid: 'accessibility', chartColor: categoricalPalette[3] },
  { uid: 'functional', chartColor: categoricalPalette[4] },
  { uid: 'acceptance', chartColor: categoricalPalette[5] },
  { uid: 'usability', chartColor: categoricalPalette[6] },
  { uid: 'smokeSanity', chartColor: categoricalPalette[7] },
  { uid: 'compatibility', chartColor: categoricalPalette[0] },
  { uid: 'destructive', chartColor: categoricalPalette[1] },
  { uid: 'regression', chartColor: categoricalPalette[2] },
  { uid: 'automated', chartColor: categoricalPalette[3] },
  { uid: 'manual', chartColor: categoricalPalette[4] },
];

const automationStatus = [
  { name: 'Automated', uid: 'automated' },
  { name: 'Automation Not Required', uid: 'automation-not-required' },
  { name: 'Cannot Be Automated', uid: 'cannot-be-automated' },
  { name: 'Obsolete', uid: 'obsolete' },
];

const templates = [{ uid: 'text' }, { uid: 'step' }];

const testRunStatus = [
  { uid: 'new' },
  { uid: 'inProgress' },
  { uid: 'underReview' },
  { uid: 'rejected' },
  { uid: 'done' },
  { uid: 'closed' },
];

const testRunCaseStatus = [
  {
    uid: 'untested',
    color: 'primary',
    chartColor: '#3ac6e1',
  },
  { uid: 'passed', color: 'success', chartColor: '#6ea56c' },
  { uid: 'failed', color: 'danger', chartColor: '#f15f47' },
  { uid: 'retest', color: 'warning', chartColor: '#fba91e' },
  { uid: 'skipped', color: 'primary', chartColor: '#805aab' },
];

export {
  roles,
  memberRoles,
  locales,
  priorities,
  testTypes,
  automationStatus,
  templates,
  testRunStatus,
  testRunCaseStatus,
};
