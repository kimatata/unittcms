import { ProjectDialogMessages } from '@/types/project';
import SettingsPage from './SettingsPage';
import { useTranslations } from 'next-intl';
import { SettingsMessages } from '@/types/settings';

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
  };

  const projectDialogMessages: ProjectDialogMessages = {
    project: t('project'),
    projectName: t('project_name'),
    projectDetail: t('project_detail'),
    public: t('public'),
    private: t('private'),
    ifYouMakePublic: t('if_you_make_public'),
    close: t('close'),
    create: t('create'),
    update: t('update'),
    pleaseEnter: t('please_enter'),
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
