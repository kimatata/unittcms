'use client';
import { useState, useEffect, useContext } from 'react';
import { Button } from '@heroui/react';
import { Plus } from 'lucide-react';
import { Tree } from 'react-arborist';
import FolderDialog from './FolderDialog';
import FolderItem from './FolderItem';
import { fetchFolders, createFolder, updateFolder, deleteFolder } from './foldersControl';
import { usePathname, useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import useGetCurrentIds from '@/utils/useGetCurrentIds';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { FolderType, FoldersMessages, TreeNodeData } from '@/types/folder';
import { logError } from '@/utils/errorHandler';
import { buildFolderTree } from '@/utils/buildFolderTree';

type Props = {
  projectId: string;
  messages: FoldersMessages;
  locale: string;
};

export default function FoldersPane({ projectId, messages, locale }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const context = useContext(TokenContext);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const { folderId } = useGetCurrentIds();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [parentFolderId, setParentFolderId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }
      try {
        const fetchedFolders: FolderType[] = await fetchFolders(context.token.access_token, Number(projectId));
        const tree = buildFolderTree(fetchedFolders);
        setTreeData(tree);

        if (tree.length === 0) {
          return;
        }

        const selectedFolderFromUrl = fetchedFolders.find((folder) => folder.id === folderId);
        setSelectedFolder(selectedFolderFromUrl ? selectedFolderFromUrl : null);

        if (pathname === `/projects/${projectId}/folders`) {
          const smallestFolderId = Math.min(...fetchedFolders.map((folder) => folder.id));
          router.push(`/projects/${projectId}/folders/${smallestFolderId}/cases`, { locale });
        }
      } catch (error: unknown) {
        logError('Error fetching folders:', error);
      }
    }

    fetchDataEffect();
  }, [context, folderId, locale, pathname, projectId, router]);

  const openDialogForCreate = (folderId: number | null = null) => {
    setParentFolderId(folderId);
    setIsFolderDialogOpen(true);
    setEditingFolder(null);
  };

  const closeDialog = () => {
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
    setParentFolderId(null);
  };

  const onSubmit = async (name: string, detail: string) => {
    if (editingFolder) {
      await updateFolder(context.token.access_token, editingFolder.id, name, detail, projectId, parentFolderId);
    } else {
      await createFolder(context.token.access_token, name, detail, projectId, parentFolderId);
    }
    const fetchedFolders: FolderType[] = await fetchFolders(context.token.access_token, Number(projectId));
    const tree = buildFolderTree(fetchedFolders);
    setTreeData(tree);
    closeDialog();
  };

  const onEditClick = (folder: FolderType) => {
    setEditingFolder(folder);
    setParentFolderId(folder.parentFolderId);
    setIsFolderDialogOpen(true);
  };

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
      const fetchedFolders: FolderType[] = await fetchFolders(context.token.access_token, Number(projectId));
      const tree = buildFolderTree(fetchedFolders);
      setTreeData(tree);
      router.push(`/projects/${projectId}/folders`, { locale });
      closeDeleteConfirmDialog();
    }
  };

  return (
    <>
      <div className="w-80 min-h-[calc(100vh-64px)] border-r-1 dark:border-neutral-700">
        <Button
          startContent={<Plus size={16} />}
          size="sm"
          variant="bordered"
          className="m-2"
          isDisabled={!context.isProjectDeveloper(Number(projectId))}
          onPress={() => openDialogForCreate()}
        >
          {messages.newFolder}
        </Button>

        {treeData.length > 0 && (
          <Tree
            data={treeData}
            className="w-full"
            indent={16}
            rowHeight={42}
            overscanCount={5}
            paddingTop={20}
            paddingBottom={20}
            padding={20}
            width="100%"
            openByDefault={false}
            disableDrop={true}
            disableDrag={true}
          >
            {(props) => (
              <FolderItem
                {...props}
                projectId={projectId}
                selectedFolder={selectedFolder}
                locale={locale}
                messages={messages}
                openDialogForCreate={openDialogForCreate}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
              />
            )}
          </Tree>
        )}
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
