import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import MembersPage from './MembersPage';
import { LocaleCodeType } from '@/types/locale';
import { InvitationMessages } from '@/types/invitation';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Members' });
  return {
    title: `${t('member_management')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: { projectId: string; locale: string } }) {
  const t = useTranslations('Members');
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
    areYouSure: t('are_you_sure'),
    memberAdded: t('member_added'),
    roleChanged: t('role_changed'),
    memberDeleted: t('member_deleted'),
  };

  const it = useTranslations('Invitation');
  const invitationMessages: InvitationMessages = {
    invite: it('invite'),
    inviteTitle: it('invite_title'),
    inviteIntro: it('invite_intro'),
    role: it('role'),
    emailOptional: it('email_optional'),
    create: it('create'),
    close: it('close'),
    copy: it('copy'),
    shareWhatsapp: it('share_whatsapp'),
    shareEmail: it('share_email'),
    shareSubject: it('share_subject'),
    shareBody: it('share_body'),
    pending: it('pending'),
    noPending: it('no_pending'),
    revoke: it('revoke'),
    expiresOn: it('expires_on'),
    inviteError: it('invite_error'),
    roleManager: t('manager'),
    roleDeveloper: t('developer'),
    roleReporter: t('reporter'),
  };

  return (
    <>
      <MembersPage
        projectId={params.projectId}
        locale={params.locale}
        messages={messages}
        invitationMessages={invitationMessages}
      />
    </>
  );
}
