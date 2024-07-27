import { useTranslations } from 'next-intl';
import AccountPage from './AccountPage';
import { PageType } from '@/types/common';

export default function Page({ params }: PageType) {
  const t = useTranslations('Auth');
  const messages = {
    yourProjects: t('your_projects'),
    public: t('public'),
    private: t('private'),
    noProjectsFound: t('no_projects_found'),
  };

  return <AccountPage messages={messages} locale={params.locale} />;
}
