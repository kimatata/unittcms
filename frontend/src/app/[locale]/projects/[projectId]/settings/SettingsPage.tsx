'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, Switch, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { addToast } from '@heroui/react';
import { Pencil, Trash } from 'lucide-react';
import ProjectTagsManager from './ProjectTagsManager';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import { deleteProject, fetchProject, updateProject } from '@/utils/projectsControl';
import { ProjectDialogMessages, ProjectType } from '@/types/project';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { useRouter } from '@/src/i18n/routing';
import ProjectDialog from '@/components/ProjectDialog';
import { UserType } from '@/types/user';
import { findUser } from '@/utils/usersControl';
import { logError } from '@/utils/errorHandler';
import UserAvatar from '@/components/UserAvatar';
import { fetchAutomationConfig, updateAutoFixEnabled, deleteAutomationRepo } from '@/utils/automationConfigControl';
import { AutomationConfigType } from '@/types/project';

type Props = {
  projectId: string;
  messages: SettingsMessages;
  projectDialogMessages: ProjectDialogMessages;
  locale: string;
};

export default function SettingsPage({ projectId, messages, projectDialogMessages, locale }: Props) {
  const context = useContext(TokenContext);
  const router = useRouter();
  const [automationConfig, setAutomationConfig] = useState<AutomationConfigType | null>(null);
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
    locale: null,
  });

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProject(context.token.access_token, Number(projectId));
        setProject(data);
        const aCfg = await fetchAutomationConfig(context.token.access_token, Number(projectId));
        setAutomationConfig(aCfg);

        if (data.userId) {
          const ownerData = await findUser(context.token.access_token, data.userId);
          setOwner(ownerData);
        } else {
          console.error('failed to get project owner id');
        }
      } catch (error: unknown) {
        logError('Error fetching project data:', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId]);

  const [isDeleteRepoDialogOpen, setIsDeleteRepoDialogOpen] = useState(false);
  const [isDeletingRepo, setIsDeletingRepo] = useState(false);

  const handleDeleteRepo = async () => {
    if (!automationConfig) return;
    setIsDeletingRepo(true);
    try {
      const updated = await deleteAutomationRepo(context.token.access_token, automationConfig.id);
      setAutomationConfig(updated);
      setIsDeleteRepoDialogOpen(false);
      addToast({ title: messages.deleteAutomationProjectSuccess, color: 'success' });
    } catch (error) {
      logError('SettingsPage deleteRepo', error);
      addToast({ title: messages.deleteAutomationProjectError, color: 'danger' });
    } finally {
      setIsDeletingRepo(false);
    }
  };

  const handleAutoFixToggle = async (enabled: boolean) => {
    if (!automationConfig) return;
    try {
      const updated = await updateAutoFixEnabled(context.token.access_token, automationConfig.id, enabled);
      setAutomationConfig(updated);
      addToast({ title: messages.autoFixUpdated, color: 'success' });
    } catch (error) {
      logError('SettingsPage autoFix toggle', error);
      addToast({ title: messages.autoFixUpdateError, color: 'danger' });
    }
  };

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
                  <UserAvatar size={24} username={owner.username} avatarPath={owner.avatarPath} />
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

      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.tagManagement}</h3>
      </div>

      <div className="w-full p-3">
        <ProjectTagsManager projectId={projectId} messages={messages} />
      </div>

      {/* Automation Settings — only shown when an automation config exists */}
      {automationConfig && (
        <>
          <div className="w-full p-3 flex items-center justify-between mt-4">
            <h3 className="font-bold">{messages.automationSettings}</h3>
          </div>
          <div className="w-full p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 border-1 dark:border-neutral-700 rounded-lg p-4">
              <div>
                <p className="text-sm font-medium">{messages.autoFixEnabled}</p>
                <p className="text-xs text-default-500">{messages.autoFixDescription}</p>
              </div>
              <Switch
                isSelected={automationConfig.autoFixEnabled ?? false}
                onValueChange={handleAutoFixToggle}
                size="sm"
              />
            </div>

            {automationConfig.repoUrl && (
              <div className="flex items-center justify-between gap-4 border-1 border-danger-200 dark:border-danger-800 rounded-lg p-4">
                <div>
                  <p className="text-sm font-medium text-danger">{messages.deleteAutomationProject}</p>
                  <p className="text-xs text-default-500">{automationConfig.repoUrl}</p>
                </div>
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  startContent={<Trash size={14} />}
                  isLoading={isDeletingRepo}
                  onPress={() => setIsDeleteRepoDialogOpen(true)}
                >
                  {messages.deleteAutomationProject}
                </Button>
              </div>
            )}
          </div>
        </>
      )}

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

      <DeleteConfirmDialog
        isOpen={isDeleteRepoDialogOpen}
        onCancel={() => setIsDeleteRepoDialogOpen(false)}
        onConfirm={handleDeleteRepo}
        closeText={messages.close}
        confirmText={messages.deleteAutomationProjectConfirm}
        deleteText={messages.deleteAutomationProject}
      />
    </div>
  );
}
