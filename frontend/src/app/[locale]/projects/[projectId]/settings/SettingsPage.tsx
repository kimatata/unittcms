'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/react';
import { Pencil, Trash } from 'lucide-react';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import { deleteProject, fetchProject, updateProject } from '@/utils/projectsControl';
import { ProjectType } from '@/types/project';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useRouter } from '@/src/navigation';
import ProjectDialog from '@/components/ProjectDialog';

type Props = {
  projectId: string;
  messages: SettingsMessages;
  locale: string;
};

export default function SettingsPage({ projectId, messages, locale }: Props) {
  const context = useContext(TokenContext);
  const router = useRouter();
  const [project, setProject] = useState<ProjectType>({
    id: 0,
    name: '',
    detail: '',
    isPublic: false,
    userId: 0,
    createdAt: '',
    updatedAt: '',
    Folders: [],
    Runs: [],
  });

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProject(context.token.access_token, Number(projectId));
        setProject(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  // project dialog
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const onSubmit = async (name: string, detail: string, isPublic: boolean) => {
    const updatedProject = await updateProject(context.token.access_token, project.id, name, detail, isPublic);
    setProject(updatedProject);
    setIsProjectDialogOpen(false);
  };

  // delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const onConfirm = async () => {
    await deleteProject(context.token.access_token, Number(projectId));
    setIsDeleteConfirmDialogOpen(false);
    router.push(`/projects/`, { locale: locale });
  };

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.projectManagement}</h3>
        <div>
          <Button
            startContent={<Trash size={16} />}
            size="sm"
            color="danger"
            isDisabled={!context.isProjectManager(Number(projectId))}
            onClick={() => setIsDeleteConfirmDialogOpen(true)}
          >
            {messages.deleteProject}
          </Button>
          <Button
            startContent={<Pencil size={16} />}
            size="sm"
            color="primary"
            isDisabled={!context.isProjectManager(Number(projectId))}
            onClick={() => setIsProjectDialogOpen(true)}
            className="ms-2"
          >
            {messages.editProject}
          </Button>
        </div>
      </div>

      <div className="w-full p-3">
        <Table hideHeader aria-label="Example static collection table">
          <TableHeader>
            <TableColumn>dummy</TableColumn>
            <TableColumn>dummy</TableColumn>
          </TableHeader>
          <TableBody>
            <TableRow key="1">
              <TableCell>{messages.projectName}</TableCell>
              <TableCell>{project.name}</TableCell>
            </TableRow>
            <TableRow key="2">
              <TableCell>{messages.projectDetail}</TableCell>
              <TableCell>{project.detail}</TableCell>
            </TableRow>
            <TableRow key="3">
              <TableCell>{messages.publicity}</TableCell>
              <TableCell>{project.isPublic ? messages.public : messages.private}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <ProjectDialog
        isOpen={isProjectDialogOpen}
        editingProject={project}
        onCancel={() => setIsProjectDialogOpen(false)}
        onSubmit={onSubmit}
        messages={messages}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmDialogOpen}
        onCancel={() => setIsDeleteConfirmDialogOpen(false)}
        onConfirm={onConfirm}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </div>
  );
}
