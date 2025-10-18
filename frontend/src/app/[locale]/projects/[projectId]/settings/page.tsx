import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import SettingsPage from './SettingsPage';
import { LocaleCodeType } from '@/types/locale';
import { ProjectDialogMessages } from '@/types/project';
import { SettingsMessages } from '@/types/settings';

export async function generateMetadata({ params: { locale } }: { params: { locale: LocaleCodeType } }) {
  const t = await getTranslations({ locale, namespace: 'Settings' });
  return {
    title: `${t('project_management')} | UnitTCMS`,
    robots: { index: false, follow: false },
  };
}

export default function Page({ params }: { params: { projectId: string; locale: string } }) {
  const t = useTranslations('Settings');
  const messages: SettingsMessages = {
    projectManagement: t('project_management'),
    projectName: t('project_name'),
    projectDetail: t('project_detail'),
    projectOwner: t('project_owner'),
    editProject: t('edit_project'),
    public: t('public'),
    publicity: t('publicity'),
    private: t('private'),
    deleteProject: t('delete_project'),
    delete: t('delete'),
    close: t('close'),
    areYouSure: t('are_you_sure'),
    tagManagement: t('tag_management'),
    tagName: t('tag_name'),
    addTag: t('add_tag'),
    noTagsAvailable: t('no_tags_available'),
    deleteTag: t('delete_tag'),
    areYouSureDeleteTag: t('are_you_sure_delete_tag'),
    tagCreated: t('tag_created'),
    tagUpdated: t('tag_updated'),
    tagDeleted: t('tag_deleted'),
    tagErrorEmpty: t('tag_error_empty'),
    tagErrorMinLength: t('tag_error_min_length'),
    tagErrorMaxLength: t('tag_error_max_length'),
    tagErrorCreate: t('tag_error_create'),
    tagErrorUpdate: t('tag_error_update'),
    tagErrorDelete: t('tag_error_delete'),
  };

  const pt = useTranslations('ProjectDialog');
  const projectDialogMessages: ProjectDialogMessages = {
    project: pt('project'),
    projectName: pt('project_name'),
    projectDetail: pt('project_detail'),
    public: pt('public'),
    private: pt('private'),
    ifYouMakePublic: pt('if_you_make_public'),
    close: pt('close'),
    create: pt('create'),
    update: pt('update'),
    pleaseEnter: pt('please_enter'),
  };

  return (
    <>
      <SettingsPage
        projectId={params.projectId}
        messages={messages}
        projectDialogMessages={projectDialogMessages}
        locale={params.locale}
      />
    </>
  );
}
