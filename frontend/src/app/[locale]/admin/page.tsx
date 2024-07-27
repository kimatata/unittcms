import { useTranslations } from 'next-intl';
import AdminPage from './AdminPage';
import { PageType } from '@/types/base';
import { LocaleCodeType } from '@/types/locale';

export default function Page({ params }: PageType) {
  const t = useTranslations('Admin');
  const messages = {
    admin: t('admin'),
    userManagement: t('user_management'),
    avatar: t('avatar'),
    id: t('id'),
    email: t('email'),
    username: t('username'),
    role: t('role'),
    administrator: t('administrator'),
    user: t('user'),
    noUsersFound: t('no_users_found'),
  };

  return (
    <div className="w-full flex items-center justify-center">
      <AdminPage messages={messages} locale={params.locale as LocaleCodeType} />
    </div>
  );
}
