import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import CasesPane from './CasesPane';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { RunStatusMessages } from '@/types/status';
import { LocaleCodeType } from '@/types/locale';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Cases' });
  return {
    title: `${t('test_case_list')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: { projectId: string; folderId: string; locale: string } }) {
  const t = useTranslations('Cases');
  const messages = {
    testCaseList: t('test_case_list'),
    id: t('id'),
    title: t('title'),
    priority: t('priority'),
    actions: t('actions'),
    deleteCase: t('delete_case'),
    delete: t('delete'),
    close: t('close'),
    areYouSure: t('are_you_sure'),
    newTestCase: t('new_test_case'),
    export: t('export'),
    status: t('status'),
    noCasesFound: t('no_cases_found'),
    caseTitle: t('case_title'),
    caseDescription: t('case_description'),
    create: t('create'),
    pleaseEnter: t('please_enter'),
    apply: t('apply'),
    filter: t('filter'),
    clearAll: t('clear_all'),
    selectPriorities: t('select_priorities'),
    selected: t('selected'),
    type: t('type'),
    selectTypes: t('select_types'),
    casesSelected: t('cases_selected'),
    selectAction: t('select_action'),
    move: t('move'),
    clone: t('clone'),
    casesMoved: t('cases_moved'),
    casesCloned: t('cases_cloned'),
  };

  const priorityTranslation = useTranslations('Priority');
  const priorityMessages: PriorityMessages = {
    critical: priorityTranslation('critical'),
    high: priorityTranslation('high'),
    medium: priorityTranslation('medium'),
    low: priorityTranslation('low'),
  };

  const testTypeTranslation = useTranslations('Type');
  const testTypeMessages: TestTypeMessages = {
    other: testTypeTranslation('other'),
    security: testTypeTranslation('security'),
    performance: testTypeTranslation('performance'),
    accessibility: testTypeTranslation('accessibility'),
    functional: testTypeTranslation('functional'),
    acceptance: testTypeTranslation('acceptance'),
    usability: testTypeTranslation('usability'),
    smokeSanity: testTypeTranslation('smoke_sanity'),
    compatibility: testTypeTranslation('compatibility'),
    destructive: testTypeTranslation('destructive'),
    regression: testTypeTranslation('regression'),
    automated: testTypeTranslation('automated'),
    manual: testTypeTranslation('manual'),
  };

  const runStatusTranslation = useTranslations('RunStatus');
  const runStatusMessages: RunStatusMessages = {
    new: runStatusTranslation('new'),
    inProgress: runStatusTranslation('inProgress'),
    underReview: runStatusTranslation('underReview'),
    rejected: runStatusTranslation('rejected'),
    done: runStatusTranslation('done'),
    closed: runStatusTranslation('closed'),
  };

  return (
    <>
      <CasesPane
        projectId={params.projectId}
        folderId={params.folderId}
        locale={params.locale as LocaleCodeType}
        messages={messages}
        priorityMessages={priorityMessages}
        testTypeMessages={testTypeMessages}
        runStatusMessages={runStatusMessages}
      />
    </>
  );
}
