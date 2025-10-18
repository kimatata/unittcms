'use client';
import { useState, useEffect, useContext } from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody,
  Input,
  addToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@heroui/react';
import Avatar from 'boring-avatars';
import { Check, Pencil, Plus, Trash, Trash2, X } from 'lucide-react';
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
import { createTag, deleteTag, fetchCaseTags, updateTag } from '@/utils/caseTagsControls';
import { CaseTags } from '@/types/caseTags';

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

  const [tags, setTags] = useState<CaseTags[]>([]);
  const [editedTagName, setEditedTagName] = useState('');
  const [tagName, setTagName] = useState('');
  const [isValidTag, setIsValidTag] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isValidEditTag, setIsValidEditTag] = useState(true);
  const [editErrorMessage, setEditErrorMessage] = useState('');

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProject(context.token.access_token, Number(projectId));
        setProject(data);
        const caseTags = (await fetchCaseTags(context.token.access_token, projectId)) || [];
        setTags(caseTags);

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
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [openPopoverTagId, setOpenPopoverTagId] = useState<number | null>(null);

  const validateTagName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setIsValidTag(false);
      setErrorMessage(messages.tagErrorEmpty);
      return false;
    }
    if (trimmedName.length < 3) {
      setIsValidTag(false);
      setErrorMessage(messages.tagErrorMinLength);
      return false;
    }
    if (trimmedName.length > 20) {
      setIsValidTag(false);
      setErrorMessage(messages.tagErrorMaxLength);
      return false;
    }
    setIsValidTag(true);
    setErrorMessage('');
    return true;
  };

  const validateEditTagName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setIsValidEditTag(false);
      setEditErrorMessage(messages.tagErrorEmpty);
      return false;
    }
    if (trimmedName.length < 3) {
      setIsValidEditTag(false);
      setEditErrorMessage(messages.tagErrorMinLength);
      return false;
    }
    if (trimmedName.length > 20) {
      setIsValidEditTag(false);
      setEditErrorMessage(messages.tagErrorMaxLength);
      return false;
    }
    setIsValidEditTag(true);
    setEditErrorMessage('');
    return true;
  };

  const onCreateTag = async () => {
    if (!validateTagName(tagName)) {
      return;
    }
    try {
      const newTag = await createTag(context.token.access_token, projectId, tagName);
      setTags((prev) => [...prev, newTag]);
      setIsValidTag(true);
      setErrorMessage('');
      setTagName('');
      addToast({
        title: 'Success',
        description: messages.tagCreated,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorCreate;
      addToast({
        title: 'Error',
        description: errorMessage,
      });
      logError('Error creating tag:', error);
    }
  };

  const onUpdateTag = async (tagId: number) => {
    if (!validateEditTagName(editedTagName)) {
      return;
    }
    try {
      await updateTag(context.token.access_token, projectId, tagId, editedTagName);
      setTags(tags.map((tag) => (tag.id === tagId ? { ...tag, name: editedTagName } : tag)));
      setEditingTag(null);
      setEditedTagName('');
      setIsValidEditTag(true);
      setEditErrorMessage('');
      addToast({
        title: 'Success',
        description: messages.tagUpdated,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorUpdate;
      addToast({
        title: 'Error',
        description: errorMessage,
      });
      logError('Error updating tag:', error);
    }
  };

  const onDeleteTag = async (tagId: number) => {
    try {
      await deleteTag(context.token.access_token, projectId, tagId);
      setTags(tags.filter((tag) => tag.id !== tagId));
      setOpenPopoverTagId(null);
      addToast({
        title: 'Success',
        description: messages.tagDeleted,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : messages.tagErrorDelete;
      addToast({
        title: 'Error',
        description: errorMessage,
      });
      logError('Error deleting tag:', error);
    }
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

      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.tagManagement}</h3>
      </div>

      <div className="w-full p-3">
        <Card>
          <CardBody>
            <div className="mb-6 flex items-baseline gap-3">
              <Input
                size="sm"
                type="text"
                placeholder={messages.tagName}
                variant="bordered"
                isInvalid={!isValidTag}
                errorMessage={errorMessage}
                value={tagName}
                onChange={(e) => {
                  setTagName(e.target.value);
                  validateTagName(e.target.value);
                }}
                classNames={{
                  inputWrapper: 'h-10 flex',
                }}
              />

              <div>
                <Button
                  startContent={<Plus className="w-4 h-4" />}
                  color="primary"
                  isDisabled={!context.isProjectOwner(Number(projectId)) || !isValidTag}
                  onPress={() => {
                    if (!validateTagName(tagName)) {
                      return;
                    }
                    onCreateTag();
                    setTagName('');
                  }}
                >
                  {messages.addTag}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              {tags.length === 0 && <div className="text-center text-gray-500 mb-3">{messages.noTagsAvailable}</div>}

              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 hover:dark:bg-[#2a2a2a] transition-colors rounded-lg"
                >
                  {editingTag === tag.id ? (
                    <>
                      <div className="flex flex-1 items-start gap-3">
                        <Input
                          size="sm"
                          type="text"
                          variant="bordered"
                          value={editedTagName}
                          onChange={(e) => {
                            setEditedTagName(e.target.value);
                            validateEditTagName(e.target.value);
                          }}
                          isInvalid={!isValidEditTag}
                          errorMessage={editErrorMessage}
                          classNames={{
                            inputWrapper: 'h-7 flex',
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            isIconOnly
                            isDisabled={!isValidEditTag}
                            onPress={() => onUpdateTag(tag.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 "
                            isIconOnly
                            onPress={() => {
                              setEditingTag(null);
                              setEditedTagName('');
                              setIsValidEditTag(true);
                              setEditErrorMessage('');
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{tag.name}</span>
                      </div>
                      <div className="flex gap-2 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          isIconOnly
                          onPress={() => {
                            setEditingTag(tag.id);
                            setEditedTagName(tag.name);
                            validateEditTagName(tag.name);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Popover
                          placement="top"
                          isOpen={openPopoverTagId === tag.id}
                          onOpenChange={(open) => setOpenPopoverTagId(open ? tag.id : null)}
                        >
                          <PopoverTrigger>
                            <Button size="sm" variant="ghost" color="danger" className="h-8 " isIconOnly>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="px-1 py-2">
                              <div className="text-small font-bold">{messages.deleteTag}</div>
                              <div className="text-tiny">{messages.areYouSureDeleteTag}</div>
                              <div className="flex justify-end gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8"
                                  isIconOnly
                                  onPress={() => setOpenPopoverTagId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8"
                                  color="danger"
                                  isIconOnly
                                  onPress={() => onDeleteTag(tag.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
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
