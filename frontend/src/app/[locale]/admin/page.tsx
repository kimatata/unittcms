import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import AdminPage from './AdminPage';
import { PageType } from '@/types/base';
import { LocaleCodeType } from '@/types/locale';
import { AdminMessages } from '@/types/user';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return {
    title: `${t('user_management')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: PageType) {
  const t = useTranslations('Admin');
  const messages: AdminMessages = {
    userManagement: t('user_management'),
    avatar: t('avatar'),
    id: t('id'),
    email: t('email'),
    username: t('username'),
    role: t('role'),
    administrator: t('administrator'),
    user: t('user'),
    noUsersFound: t('no_users_found'),
    quitAdmin: t('quit_admin'),
    quit: t('quit'),
    quitConfirm: t('quit_confirm'),
    close: t('close'),
    roleChanged: t('role_changed'),
    lostAdminAuth: t('lost_admin_auth'),
    atLeast: t('at_least'),
  };

  return (
    <div className="w-full flex items-center justify-center">
      <AdminPage messages={messages} locale={params.locale as LocaleCodeType} />
    </div>
  );
}
