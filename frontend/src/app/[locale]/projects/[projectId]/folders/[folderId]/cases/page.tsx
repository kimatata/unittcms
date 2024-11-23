import { PriorityMessages } from '@/types/priority';
import CasesPane from './CasesPane';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
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
    status: t('status'),
    noCasesFound: t('no_cases_found'),
    caseTitle: t('case_title'),
    caseDescription: t('case_description'),
    create: t('create'),
    pleaseEnter: t('please_enter'),
  };

  const priorityTranslation = useTranslations('Priority');
  const priorityMessages: PriorityMessages = {
    critical: priorityTranslation('critical'),
    high: priorityTranslation('high'),
    medium: priorityTranslation('medium'),
    low: priorityTranslation('low'),
  };

  return (
    <>
      <CasesPane
        projectId={params.projectId}
        folderId={params.folderId}
        locale={params.locale as LocaleCodeType}
        messages={messages}
        priorityMessages={priorityMessages}
      />
    </>
  );
}
