import { PageType } from '@/types/base';
import ProjectsPage from './ProjectsPage';
import { useTranslations } from 'next-intl';
import { LocaleCodeType } from '@/types/locale';
import { ProjectDialogMessages, ProjectsMessages } from '@/types/project';

export default function Page({ params }: PageType) {
  const t = useTranslations('Projects');
  const messages: ProjectsMessages = {
    projectList: t('projectList'),
    newProject: t('new_project'),
    id: t('id'),
    publicity: t('publicity'),
    public: t('public'),
    private: t('private'),
    name: t('name'),
    detail: t('detail'),
    lastUpdate: t('last_update'),
    noProjectsFound: t('no_projects_found'),
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
      <ProjectsPage
        messages={messages}
        projectDialogMessages={projectDialogMessages}
        locale={params.locale as LocaleCodeType}
      />
    </>
  );
}
