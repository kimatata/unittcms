import { ProjectHome } from './ProjectHome';
import { useTranslations } from 'next-intl';
import { PriorityMessages } from '@/types/priority';

export type HomeMessages = {
  folders: string;
  testCases: string;
  testRuns: string;
  progress: string;
  untested: string;
  passed: string;
  failed: string;
  retest: string;
  skipped: string;
  testClassification: string;
  byType: string;
  byPriority: string;
  testTypes: string;
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

export default function Page({ params }: { params: { projectId: string } }) {
  const t = useTranslations('Home');
  const messages = {
    folders: t('Folders'),
    testCases: t('test_cases'),
    testRuns: t('test_runs'),
    progress: t('progress'),
    untested: t('untested'),
    passed: t('passed'),
    failed: t('failed'),
    retest: t('retest'),
    skipped: t('skipped'),
    testClassification: t('test_classification'),
    byType: t('by_type'),
    byPriority: t('by_priority'),
    other: t('other'),
    security: t('security'),
    performance: t('performance'),
    accessibility: t('accessibility'),
    functional: t('functional'),
    acceptance: t('acceptance'),
    usability: t('usability'),
    smokeSanity: t('smoke_sanity'),
    compatibility: t('compatibility'),
    destructive: t('destructive'),
    regression: t('regression'),
    automated: t('automated'),
    manual: t('manual'),
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
      <ProjectHome projectId={params.projectId} messages={messages} priorityMessages={priorityMessages} />
    </>
  );
}
