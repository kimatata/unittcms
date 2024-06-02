'use client';
import { useEffect, useState, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { ProjectType, ProjectsMessages } from '@/types/project';
import ProjectsTable from './ProjectsTable';
import ProjectDialog from '@/components/ProjectDialog';
import { fetchProjects, createProject, updateProject, deleteProject } from '@/utils/projectsControl';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

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

  // delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<number | null>(null);
  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
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
    setIsDeleteConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (deleteProjectId) {
      await deleteProject(context.token.access_token, deleteProjectId);
      setProjects(projects.filter((project) => project.id !== deleteProjectId));
      closeDeleteConfirmDialog();
    }
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

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmDialogOpen}
        onCancel={closeDeleteConfirmDialog}
        onConfirm={onConfirm}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </div>
  );
}
