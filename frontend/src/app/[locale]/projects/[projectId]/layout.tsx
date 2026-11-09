import { useTranslations } from 'next-intl';
import Sidebar from './Sidebar';
import { ProjectMessages } from '@/types/project';

export default function SidebarLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = useTranslations('Project');
  const messages: ProjectMessages = {
    toggleSidebar: t('toggle_sidebar'),
    home: t('home'),
    testCases: t('test_cases'),
    testRuns: t('test_runs'),
    members: t('members'),
    settings: t('settings'),
  };

  return (
    <>
      <div className="flex border-t-1 dark:border-neutral-700 min-h-[calc(100vh-64px)]">
        <Sidebar messages={messages} locale={locale} />
        <div className="flex min-w-0 flex-1">
          {/* `min-w-0` : sans lui, un enfant large — un tableau, un graphique —
              empêche cette colonne de rétrécir, et c'est la page entière qui
              défile au lieu de l'enfant. */}
          <div className="min-w-0 flex-grow">{children}</div>
        </div>
      </div>
    </>
  );
}
