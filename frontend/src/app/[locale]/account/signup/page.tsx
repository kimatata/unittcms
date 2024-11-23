import { PageType } from '@/types/base';
import AuthPage from '../authPage';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { LocaleCodeType } from '@/types/locale';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Auth' });
  return {
    title: `${t('signup')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: PageType) {
  const t = useTranslations('Auth');
  const messages = {
    title: t('signup'),
    linkTitle: t('or_signin'),
    submitTitle: t('signup'),
    signInAsGuest: t('signin_as_guest'),
    email: t('email'),
    username: t('username'),
    password: t('password'),
    confirmPassword: t('confirm_password'),
    invalidEmail: t('invalid_email'),
    invalidPassword: t('invalid_password'),
    usernameEmpty: t('username_empty'),
    passwordDoesNotMatch: t('password_not_match'),
    EmailAlreadyExist: t('email_already_exist'),
    emailNotExist: t('email_not_exist'),
    signupError: t('signup_error'),
    signinError: t('signin_error'),
    demoPageWarning: t('demo_page_warning'),
  };
  return (
    <>
      <AuthPage isSignup={true} messages={messages} locale={params.locale as LocaleCodeType} />
    </>
  );
}
