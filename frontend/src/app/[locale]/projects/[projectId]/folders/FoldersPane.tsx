'use client';
import { FolderType, FoldersMessages } from '@/types/folder';
import { useState, useEffect, useContext } from 'react';
import { Button, Listbox, ListboxItem } from '@heroui/react';
import { Folder, Plus } from 'lucide-react';
import { usePathname, useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import useGetCurrentIds from '@/utils/useGetCurrentIds';
import FolderDialog from './FolderDialog';
import FolderEditMenu from './FolderEditMenu';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { fetchFolders, createFolder, updateFolder, deleteFolder } from './foldersControl';

type Props = {
  projectId: string;
  messages: FoldersMessages;
  locale: string;
};

export default function FoldersPane({ projectId, messages, locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const context = useContext(TokenContext);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const { folderId } = useGetCurrentIds();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const folders: FolderType[] = await fetchFolders(context.token.access_token, Number(projectId));
        setFolders(folders);

        // no folder on project
        if (folders.length === 0) {
          return;
        }

        const selectedFolderFromUrl = folders.find((folder) => folder.id === folderId);
        setSelectedFolder(selectedFolderFromUrl ? selectedFolderFromUrl : null);

        // Redirect to the smallest folder ID page if the path is "projects/[projectId]/folders
        if (pathname === `/projects/${projectId}/folders`) {
          const smallestFolderId = Math.min(...folders.map((folder) => folder.id));
          router.push(`/projects/${projectId}/folders/${smallestFolderId}/cases`, { locale: locale });
        }
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context, folderId]);

  const openDialogForCreate = () => {
    setIsFolderDialogOpen(true);
    setEditingFolder(null);
  };

  const closeDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingFolder) {
      const updatedProject = await updateFolder(
        context.token.access_token,
        editingFolder.id,
        name,
        detail,
        projectId,
        null
      );
      const updatedProjects = folders.map((project) => (project.id === updatedProject.id ? updatedProject : project));
      setFolders(updatedProjects);
    } else {
      const newProject = await createFolder(context.token.access_token, name, detail, projectId, null);
      setFolders([...folders, newProject]);
    }
    closeDialog();
  };

  const onEditClick = (folder: FolderType) => {
    setEditingFolder(folder);
    setIsFolderDialogOpen(true);
  };

  // Delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeleteFolderId(null);
  };

  const onDeleteClick = (deleteFolderId: number) => {
    setDeleteFolderId(deleteFolderId);
    setIsDeleteConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (deleteFolderId) {
      await deleteFolder(context.token.access_token, deleteFolderId);
      router.push(`/projects/${projectId}/folders`, { locale: locale });
      closeDeleteConfirmDialog();
    }
  };

  const baseClass = '';
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700`;

  return (
    <>
      <div className="w-64 min-h-[calc(100vh-64px)] border-r-1 dark:border-neutral-700">
        <Button
          startContent={<Plus size={16} />}
          size="sm"
          variant="bordered"
          className="m-2"
          isDisabled={!context.isProjectDeveloper(Number(projectId))}
          onPress={openDialogForCreate}
        >
          {messages.newFolder}
        </Button>
        <Listbox aria-label="Listbox Variants" variant="light">
          {folders.map((folder, index) => (
            <ListboxItem
              key={index}
              onPress={() => router.push(`/projects/${projectId}/folders/${folder.id}/cases`, { locale: locale })}
              startContent={<Folder size={20} color="#F7C24E" fill="#F7C24E" />}
              className={selectedFolder && folder.id === selectedFolder.id ? selectedClass : baseClass}
              endContent={
                <FolderEditMenu
                  folder={folder}
                  isDisabled={!context.isProjectDeveloper(Number(projectId))}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                  messages={messages}
                />
              }
            >
              {folder.name}
            </ListboxItem>
          ))}
        </Listbox>
      </div>

      <FolderDialog
        isOpen={isFolderDialogOpen}
        editingFolder={editingFolder}
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
    </>
  );
}
