import { useTranslations } from 'next-intl';
import TestCaseDetail from './TestCaseDetail';
import type { RunMessages } from '@/types/run';
import type { PriorityMessages } from '@/types/priority';
// import type { RunStatusMessages, TestRunCaseStatusMessages } from '@/types/status';
import type { TestTypeMessages } from '@/types/testType';

export default function Page({
  params,
}: {
  params: { projectId: string; runId: string; caseId: string; locale: string };
}) {
  const t = useTranslations('Run');
  const messages = {
    backToRuns: t('back_to_runs'),
    updating: t('updating'),
    update: t('update'),
    updatedTestRun: t('updated_test_run'),
    export: t('export'),
    progress: t('progress'),
    refresh: t('refresh'),
    id: t('id'),
    title: t('title'),
    pleaseEnter: t('please_enter'),
    description: t('description'),
    priority: t('priority'),
    actions: t('actions'),
    status: t('status'),
    selectTestCase: t('select_test_case'),
    testCaseSelection: t('test_case_selection'),
    includeInRun: t('include_in_run'),
    excludeFromRun: t('exclude_from_run'),
    noCasesFound: t('no_cases_found'),
    areYouSureLeave: t('are_you_sure_leave'),
    testDetail: t('test_detail'),
    steps: t('steps'),
    preconditions: t('preconditions'),
    expectedResult: t('expected_result'),
    detailsOfTheStep: t('details_of_the_step'),
    close: t('close'),
    filter: t('filter'),
    clearAll: t('clear_all'),
    apply: t('apply'),
    selectStatus: t('select_status'),
    pleaseSave: t('please_save'),
    caseTitleOrDescription: t('case_title_or_description'),
    selected: t('selected'),
    tags: t('tags'),
    selectTags: t('select_tags'),
  } as unknown as RunMessages;

  // const rst = useTranslations('RunStatus');
  // const runStatusMessages: RunStatusMessages = {
  //   new: rst('new'),
  //   inProgress: rst('inProgress'),
  //   underReview: rst('underReview'),
  //   rejected: rst('rejected'),
  //   done: rst('done'),
  //   closed: rst('closed'),
  // };

  // const rcst = useTranslations('RunCaseStatus');
  // const testRunCaseStatusMessages: TestRunCaseStatusMessages = {
  //   untested: rcst('untested'),
  //   passed: rcst('passed'),
  //   failed: rcst('failed'),
  //   retest: rcst('retest'),
  //   skipped: rcst('skipped'),
  // };

  const pt = useTranslations('Priority');
  const priorityMessages: PriorityMessages = {
    critical: pt('critical'),
    high: pt('high'),
    medium: pt('medium'),
    low: pt('low'),
  };

  const tt = useTranslations('Type');
  const testTypeMessages: TestTypeMessages = {
    other: tt('other'),
    security: tt('security'),
    performance: tt('performance'),
    accessibility: tt('accessibility'),
    functional: tt('functional'),
    acceptance: tt('acceptance'),
    usability: tt('usability'),
    smokeSanity: tt('smoke_sanity'),
    compatibility: tt('compatibility'),
    destructive: tt('destructive'),
    regression: tt('regression'),
    automated: tt('automated'),
    manual: tt('manual'),
  };

  return (
    <TestCaseDetail
      projectId={params.projectId}
      runId={params.runId}
      caseId={params.caseId}
      locale={params.locale}
      messages={messages}
      priorityMessages={priorityMessages}
      testTypeMessages={testTypeMessages}
    />
  );
}
