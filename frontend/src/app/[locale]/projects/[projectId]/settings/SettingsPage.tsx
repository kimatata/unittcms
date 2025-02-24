'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import Avatar from 'boring-avatars';
import { Pencil, Trash } from 'lucide-react';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import { deleteProject, fetchProject, updateProject } from '@/utils/projectsControl';
import { ProjectDialogMessages, ProjectType } from '@/types/project';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useRouter } from '@/src/i18n/routing';
import ProjectDialog from '@/components/ProjectDialog';
import { UserType } from '@/types/user';
import { findUser } from '@/utils/usersControl';

type Props = {
  projectId: string;
  messages: SettingsMessages;
  projectDialogMessages: ProjectDialogMessages;
  locale: string;
};

export default function SettingsPage({ projectId, messages, projectDialogMessages, locale }: Props) {
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
  const [owner, setOwner] = useState<UserType>({
    id: 0,
    email: '',
    password: '',
    avatarPath: '',
    role: -1,
    username: '',
  });

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProject(context.token.access_token, Number(projectId));
        setProject(data);

        if (data.userId) {
          const ownerData = await findUser(context.token.access_token, data.userId);
          setOwner(ownerData);
        } else {
          console.error('failed to get project owner id');
        }
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
            isDisabled={!context.isProjectOwner(Number(projectId))}
            onPress={() => setIsDeleteConfirmDialogOpen(true)}
          >
            {messages.deleteProject}
          </Button>
          <Button
            startContent={<Pencil size={16} />}
            size="sm"
            color="primary"
            isDisabled={!context.isProjectOwner(Number(projectId))}
            onPress={() => setIsProjectDialogOpen(true)}
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
            <TableRow key="project-name">
              <TableCell>{messages.projectName}</TableCell>
              <TableCell>{project.name}</TableCell>
            </TableRow>
            <TableRow key="project-detail">
              <TableCell>{messages.projectDetail}</TableCell>
              <TableCell>{project.detail}</TableCell>
            </TableRow>
            <TableRow key="project-owner">
              <TableCell>{messages.projectOwner}</TableCell>
              <TableCell>
                <div className="flex gap-2 items-center">
                  <Avatar
                    size={24}
                    name={owner.username}
                    variant="beam"
                    colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
                  />
                  <p className="">{owner.username}</p>
                </div>
              </TableCell>
            </TableRow>
            <TableRow key="project-publicity">
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
        projectDialogMessages={projectDialogMessages}
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
