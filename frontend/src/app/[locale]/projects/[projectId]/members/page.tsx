import { LocaleCodeType } from '@/types/locale';
import MembersPage from './MembersPage';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

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
  };

  return (
    <>
      <MembersPage projectId={params.projectId} messages={messages} locale={params.locale} />
    </>
  );
}
