import { useTranslations } from 'next-intl';
import DetailPane from './DetailPane';
import type { RunDetailMessages } from '@/types/run';
import type { PriorityMessages } from '@/types/priority';
import type { TestTypeMessages } from '@/types/testType';

export default function Page({
  params,
}: {
  params: { projectId: string; runId: string; caseId: string; locale: string };
}) {
  const t = useTranslations('Run');
  const messages: RunDetailMessages = {
    title: t('title'),
    description: t('description'),
    priority: t('priority'),
    type: t('type'),
    tags: t('tags'),
    testDetail: t('test_detail'),
    steps: t('steps'),
    preconditions: t('preconditions'),
    expectedResult: t('expected_result'),
    detailsOfTheStep: t('details_of_the_step'),
  };

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
    <DetailPane
      projectId={params.projectId}
      caseId={params.caseId}
      locale={params.locale}
      messages={messages}
      priorityMessages={priorityMessages}
      testTypeMessages={testTypeMessages}
    />
  );
}
