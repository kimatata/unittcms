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
    delete: t('delete'),
    deleteMember: t('deleteMember'),
    noMembersFound: t('no_members_found'),
    addMember: t('add_member'),
    userNameOrEmail: t('user_name_or_email'),
    close: t('close'),
    add: t('add'),
  };

  return (
    <>
      <SettingsPage projectId={params.projectId} messages={messages} locale={params.locale} />
    </>
  );
}
