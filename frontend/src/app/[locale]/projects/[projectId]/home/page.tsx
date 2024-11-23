import { LocaleCodeType } from '@/types/locale';
import { ProjectHome } from './ProjectHome';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { TestRunCaseStatusMessages } from '@/types/status';

export type HomeMessages = {
  folders: string;
  testCases: string;
  testRuns: string;
  progress: string;
  testClassification: string;
  byType: string;
  byPriority: string;
};

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Home' });
  return {
    title: `${t('home')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: { projectId: string } }) {
  const t = useTranslations('Home');
  const messages = {
    folders: t('Folders'),
    testCases: t('test_cases'),
    testRuns: t('test_runs'),
    progress: t('progress'),
    testClassification: t('test_classification'),
    byType: t('by_type'),
    byPriority: t('by_priority'),
  };

  const rcst = useTranslations('RunCaseStatus');
  const testRunCaseStatusMessages: TestRunCaseStatusMessages = {
    untested: rcst('untested'),
    passed: rcst('passed'),
    failed: rcst('failed'),
    retest: rcst('retest'),
    skipped: rcst('skipped'),
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

  const pt = useTranslations('Priority');
  const priorityMessages: PriorityMessages = {
    critical: pt('critical'),
    high: pt('high'),
    medium: pt('medium'),
    low: pt('low'),
  };

  return (
    <>
      <ProjectHome
        projectId={params.projectId}
        messages={messages}
        testRunCaseStatusMessages={testRunCaseStatusMessages}
        testTypeMessages={testTypeMessages}
        priorityMessages={priorityMessages}
      />
    </>
  );
}
