import { useTranslations } from 'next-intl';
import HeaderNavbarMenu from './HeaderNavbarMenu';

export default function Header(params: { locale: string }) {
  const t = useTranslations('Header');
  const messages = {
    projects: t('projects'),
    admin: t('admin'),
    docs: t('docs'),
    roadmap: t('roadmap'),
    account: t('account'),
    signUp: t('signup'),
    signIn: t('signin'),
    signOut: t('signout'),
    links: t('links'),
    languages: t('languages'),
  };

  return <HeaderNavbarMenu messages={messages} locale={params.locale} />;
}
