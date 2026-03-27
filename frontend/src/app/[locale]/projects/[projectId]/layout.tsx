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
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar messages={messages} locale={locale} />
        <div className="flex w-full bg-[#f5f6ff]">
          <div className="flex-grow">{children}</div>
        </div>
      </div>
    </>
  );
}
