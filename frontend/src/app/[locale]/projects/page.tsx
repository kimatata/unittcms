import { PageType } from '@/types/base';
import ProjectsPage from './ProjectsPage';
import { useTranslations } from 'next-intl';
import { LocaleCodeType } from '@/types/locale';
import { ProjectDialogMessages, ProjectsMessages } from '@/types/project';

export default function Page({ params }: PageType) {
  const t = useTranslations('Projects');
  const messages: ProjectsMessages = {
    projectList: t('project_list'),
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
      <ProjectsPage
        messages={messages}
        projectDialogMessages={projectDialogMessages}
        locale={params.locale as LocaleCodeType}
      />
    </>
  );
}
