import { getTranslations } from 'next-intl/server';
import AcceptInvitation from './AcceptInvitation';
import { LocaleCodeType } from '@/types/locale';
import { InvitationAcceptMessages } from '@/types/invitation';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Invitation' });
  return {
    title: `${t('accept_title')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: { token: string; locale: string } }) {
  const t = await getTranslations('Invitation');
  const mt = await getTranslations('Members');
  const at = await getTranslations('Auth');

  const messages: InvitationAcceptMessages = {
    title: t('accept_title'),
    intro: t('accept_intro'),
    invalid: t('invalid'),
    invalidDetail: t('invalid_detail'),
    joinAs: t('join_as'),
    join: t('join'),
    createAccount: t('create_account'),
    emailTaken: t('email_taken'),
    acceptError: t('accept_error'),
    goToProject: t('go_to_project'),
    email: at('email'),
    username: at('username'),
    password: at('password'),
    confirmPassword: at('confirm_password'),
    passwordTooShort: at('invalid_password'),
    passwordDoesNotMatch: at('password_not_match'),
    roleManager: mt('manager'),
    roleDeveloper: mt('developer'),
    roleReporter: mt('reporter'),
  };

  return <AcceptInvitation token={params.token} locale={params.locale} messages={messages} />;
}
