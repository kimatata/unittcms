import ProjectsPage from './ProjectsPage';
import { useTranslations } from 'next-intl';

export default function Page(params: { locale: string }) {
  const t = useTranslations('Projects');
  const messages = {
    projectList: t('projectList'),
    project: t('project'),
    newProject: t('new_project'),
    editProject: t('edit_project'),
    deleteProject: t('delete_project'),
    id: t('id'),
    publicity: t('publicity'),
    name: t('name'),
    detail: t('detail'),
    lastUpdate: t('last_update'),
    actions: t('actions'),
    projectName: t('project_name'),
    projectDetail: t('project_detail'),
    public: t('public'),
    private: t('private'),
    ifYouMakePublic: t('if_you_make_public'),
    close: t('close'),
    create: t('create'),
    update: t('update'),
    pleaseEnter: t('please_enter'),
    noProjectsFound: t('no_projects_found'),
    needSignedIn: t('you_need_signed_in'),
    signIn: t('sign_in'),
  };
  return (
    <>
      <ProjectsPage messages={messages} locale={params.locale} />
    </>
  );
}
