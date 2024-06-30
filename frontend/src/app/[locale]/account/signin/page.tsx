import AuthPage from '../authPage';
import { useTranslations } from 'next-intl';

export default function Page(params: { locale: string }) {
  const t = useTranslations('Auth');
  const messages = {
    title: t('signin'),
    linkTitle: t('or_signup'),
    submitTitle: t('signin'),
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
      <AuthPage isSignup={false} messages={messages} locale={params.locale} />
    </>
  );
}
