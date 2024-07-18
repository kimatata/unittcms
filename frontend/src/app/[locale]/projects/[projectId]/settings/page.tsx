import SettingsPage from './SettingsPage';
import { useTranslations } from 'next-intl';

export default function Page({ params }: { params: { projectId: string; locale: string } }) {
  const t = useTranslations('Settings');
  const messages = {
    projectManagement: t('project_management'),
    projectName: t('project_name'),
    projectDetail: t('project_detail'),
    projectOwner: t('project_owner'),
    editProject: t('edit_project'),
    project: t('project'),
    ifYouMakePublic: t('if_you_make_public'),
    public: t('public'),
    publicity: t('publicity'),
    private: t('private'),
    update: t('update'),
    deleteProject: t('delete_project'),
    delete: t('delete'),
    close: t('close'),
    areYouSure: t('are_you_sure'),
  };

  return (
    <>
      <SettingsPage projectId={params.projectId} messages={messages} locale={params.locale} />
    </>
  );
}
