import Sidebar from './Sidebar';
import { useTranslations } from 'next-intl';

export default function SidebarLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = useTranslations('Project');
  const messages = {
    home: t('home'),
    testCases: t('test_cases'),
    testRuns: t('test_runs'),
  };

  return (
    <>
      <div className="flex border-t-1 dark:border-neutral-700 min-h-[calc(100vh-64px)]">
        <Sidebar messages={messages} locale={locale} />
        <div className="flex w-full">
          <div className="flex-grow">{children}</div>
        </div>
      </div>
    </>
  );
}
