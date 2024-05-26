'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { TokenContext } from '@/src/app/[locale]/TokenProvider';
import { ProjectType, ProjectsMessages } from '@/types/project';
import ProjectsTable from './ProjectsTable';
import ProjectDialog from './ProjectDialog';
import { fetchProjects, createProject, updateProject, deleteProject } from './projectsControl';
import ProjectDeleteDialog from './ProjectDeleteDialog';

export type Props = {
  messages: ProjectsMessages;
  locale: string;
};

export default function ProjectsPage({ messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const data = await fetchProjects(context.token.access_token);
        setProjects(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
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

  // delete dialog
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const closeDeleteDialog = () => {
    setIsDeleteProjectDialogOpen(false);
    setDeleteProjectId(null);
  };

  const onSubmit = async (name: string, detail: string, isPublic: boolean) => {
    if (editingProject) {
      const updatedProject = await updateProject(context.token.access_token, editingProject.id, name, detail, isPublic);
      const updatedProjects = projects.map((project) => (project.id === updatedProject.id ? updatedProject : project));
      setProjects(updatedProjects);
    } else {
      const newProject = await createProject(context.token.access_token, name, detail, isPublic);
      setProjects([...projects, newProject]);
    }
    closeDialog();
  };

  const onEditClick = (project: ProjectType) => {
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const onDeleteClick = (projectId: number) => {
    setDeleteProjectId(projectId);
    setIsDeleteProjectDialogOpen(true);
  };

  const onConfirm = async (projectId: number) => {
    await deleteProject(context.token.access_token, projectId);
    setProjects(projects.filter((project) => project.id !== projectId));
    closeDeleteDialog();
  };

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.projectList}</h3>
        <div>
          <Button startContent={<Plus size={16} />} size="sm" color="primary" onClick={openDialogForCreate}>
            {messages.newProject}
          </Button>
        </div>
      </div>

      <ProjectsTable
        projects={projects}
        onEditProject={onEditClick}
        onDeleteProject={onDeleteClick}
        messages={messages}
        locale={locale}
      />

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        editingProject={editingProject}
        onCancel={closeDialog}
        onSubmit={onSubmit}
        messages={messages}
      />

      <ProjectDeleteDialog
        isOpen={isDeleteProjectDialogOpen}
        deleteProjectId={deleteProjectId}
        onCancel={closeDeleteDialog}
        onConfirm={onConfirm}
        messages={messages}
      />
    </div>
  );
}
