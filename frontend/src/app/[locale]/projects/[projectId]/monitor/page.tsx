import { useTranslations } from 'next-intl';
import MonitorPage from './MonitorPage';
import { MonitorMessages } from '@/types/project';

export default function Page({ params: { projectId } }: { params: { projectId: string } }) {
  const t = useTranslations('Monitor');
  const messages: MonitorMessages = {
    monitor: t('monitor'),
    testHealthSection: t('test_health_section'),
    noRunsForMatrix: t('no_runs_for_matrix'),
  };

  return <MonitorPage projectId={projectId} messages={messages} />;
}
