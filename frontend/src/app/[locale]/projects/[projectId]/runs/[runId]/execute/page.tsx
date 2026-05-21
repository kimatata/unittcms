import { useTranslations } from 'next-intl';
import ExecutePage from './ExecutePage';
import { ExecuteMessages } from '@/types/run';
import { TestRunCaseStatusMessages } from '@/types/status';

export default function Page({
  params: { projectId, runId, locale },
}: {
  params: { projectId: string; runId: string; locale: string };
}) {
  const t = useTranslations('Execute');
  const messages: ExecuteMessages = {
    backToRuns: t('back_to_runs'),
    executeRun: t('execute_run'),
    save: t('save'),
    saving: t('saving'),
    saved: t('saved'),
    noCases: t('no_cases'),
    progress: t('progress'),
    keyboardHint: t('keyboard_hint'),
    areYouSureLeave: t('are_you_sure_leave'),
  };

  const rcst = useTranslations('RunCaseStatus');
  const testRunCaseStatusMessages: TestRunCaseStatusMessages = {
    untested: rcst('untested'),
    passed: rcst('passed'),
    failed: rcst('failed'),
    retest: rcst('retest'),
    skipped: rcst('skipped'),
  };

  return (
    <ExecutePage
      projectId={projectId}
      runId={runId}
      locale={locale}
      messages={messages}
      testRunCaseStatusMessages={testRunCaseStatusMessages}
    />
  );
}
