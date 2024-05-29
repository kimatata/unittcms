import SettingsPage from './SettingsPage';
import { useTranslations } from 'next-intl';

export default function Page({ params }: { params: { projectId: string; locale: string } }) {
  const t = useTranslations('Settings');
  const messages = {
    memberManagement: t('member_management'),
    avatar: t('avatar'),
    email: t('email'),
    username: t('username'),
    role: t('role'),
    manager: t('manager'),
    developer: t('developer'),
    reporter: t('reporter'),
    noMembersFound: t('no_members_found'),
  };

  return (
    <>
      <SettingsPage projectId={params.projectId} messages={messages} locale={params.locale} />
    </>
  );
}
