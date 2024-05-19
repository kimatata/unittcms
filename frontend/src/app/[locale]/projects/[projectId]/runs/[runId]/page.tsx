import RunEditor from './RunEditor';
import { useTranslations } from 'next-intl';

export default function Page({ params }: { params: { projectId: string; runId: string; locale: string } }) {
  const t = useTranslations('Run');
  const messages = {
    backToRuns: t('back_to_runs'),
    updating: t('updating'),
    update: t('update'),
    progress: t('progress'),
    refresh: t('refresh'),
    id: t('id'),
    title: t('title'),
    pleaseEnter: t('please_enter'),
    description: t('description'),
    new: t('new'),
    inProgress: t('inProgress'),
    underReview: t('underReview'),
    rejected: t('rejected'),
    done: t('done'),
    closed: t('closed'),
    priority: t('priority'),
    actions: t('actions'),
    status: t('status'),
    critical: t('critical'),
    high: t('high'),
    medium: t('medium'),
    low: t('low'),
    untested: t('untested'),
    passed: t('passed'),
    failed: t('failed'),
    retest: t('retest'),
    skipped: t('skipped'),
    selectTestCase: t('select_test_case'),
    testCaseSelection: t('test_case_selection'),
    includeInRun: t('include_in_run'),
    excludeFromRun: t('exclude_from_run'),
    noCasesFound: t('no_cases_found'),
  };

  return <RunEditor projectId={params.projectId} runId={params.runId} messages={messages} locale={params.locale} />;
}
