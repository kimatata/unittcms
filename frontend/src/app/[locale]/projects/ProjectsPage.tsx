'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import ProjectsTable from './ProjectsTable';
import { TokenContext } from '@/utils/TokenProvider';
import { ProjectDialogMessages, ProjectType, ProjectsMessages } from '@/types/project';
import ProjectDialog from '@/components/ProjectDialog';
import { fetchProjects, createProject } from '@/utils/projectsControl';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';

export type Props = {
  messages: ProjectsMessages;
  projectDialogMessages: ProjectDialogMessages;
  locale: LocaleCodeType;
};

export default function ProjectsPage({ messages, projectDialogMessages, locale }: Props) {
  const context = useContext(TokenContext);
  const [projects, setProjects] = useState<ProjectType[]>([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const data = await fetchProjects(context.token.access_token);
        setProjects(data);
      } catch (error: unknown) {
        logError('Error fetching data:', error);
      }
    }

    fetchDataEffect();
  }, [context]);

  // project dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectType | null>(null);
  const openDialogForCreate = () => {
    setIsProjectDialogOpen(true);
    setEditingProject(null);
  };

  const closeDialog = () => {
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const onSubmit = async (name: string, detail: string, isPublic: boolean) => {
    const newProject = await createProject(context.token.access_token, name, detail, isPublic);
    setProjects([...projects, newProject]);

    // refresh project roles
    context.refreshProjectRoles();
    closeDialog();
  };

  return (
    <div className="mx-auto max-w-5xl pt-10 px-8 flex-grow">
      <div className="w-full pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-[#2b2f37] tracking-tight">{messages.projectList}</h1>
        <div>
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            className="bg-gradient-to-r from-[#4953ac] to-[#652fe7] text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 px-5"
            onPress={openDialogForCreate}
          >
            {messages.newProject}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <ProjectsTable projects={projects} messages={messages} locale={locale} />
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        editingProject={editingProject}
        onCancel={closeDialog}
        onSubmit={onSubmit}
        projectDialogMessages={projectDialogMessages}
      />
    </div>
  );
}
