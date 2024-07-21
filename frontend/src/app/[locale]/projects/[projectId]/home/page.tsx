import { ProjectHome } from './ProjectHome';
import { useTranslations } from 'next-intl';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import { TestStatusMessages } from '@/types/testStatus';

export type HomeMessages = {
  folders: string;
  testCases: string;
  testRuns: string;
  progress: string;
  testClassification: string;
  byType: string;
  byPriority: string;
};

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

  const st = useTranslations('Status');
  const statusMessages: TestStatusMessages = {
    untested: st('untested'),
    passed: st('passed'),
    failed: st('failed'),
    retest: st('retest'),
    skipped: st('skipped'),
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
        statusMessages={statusMessages}
        testTypeMessages={testTypeMessages}
        priorityMessages={priorityMessages}
      />
    </>
  );
}
