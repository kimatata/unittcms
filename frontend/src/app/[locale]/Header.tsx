import { useTranslations } from 'next-intl';
import HeaderNavbarMenu from './HeaderNavbarMenu';

export default function Header(params: { locale: string }) {
  const t = useTranslations('Header');
  const messages = {
    docs: t('docs'),
    projects: t('projects'),
    admin: t('admin'),
    account: t('account'),
    signUp: t('signup'),
    signIn: t('signin'),
    signOut: t('signout'),
  };

  return <HeaderNavbarMenu messages={messages} locale={params.locale} />;
}
