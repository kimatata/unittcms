import { Button } from '@heroui/react';
import { ChevronDown, ChevronRight, Folder, Plus } from 'lucide-react';
import { NodeApi } from 'react-arborist';
import { useContext } from 'react';
import FolderEditMenu from './FolderEditMenu';

import { FolderType, FoldersMessages, TreeNodeData } from '@/types/folder';
import { useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';
import TreeItem from '@/components/TreeItem';

interface FolderItemProps {
  node: NodeApi<TreeNodeData>;
  style: React.CSSProperties;
  projectId: string;
  selectedFolder: FolderType | null;
  locale: string;
  messages: FoldersMessages;
  openDialogForCreate: (folderId: number | null) => void;
  onEditClick: (folder: FolderType) => void;
  onDeleteClick: (folderId: number) => void;
}

export default function FolderItem({
  node,
  style,
  projectId,
  selectedFolder,
  locale,
  messages,
  openDialogForCreate,
  onEditClick,
  onDeleteClick,
}: FolderItemProps) {
  const router = useRouter();
  const context = useContext(TokenContext);
  const isSelected = selectedFolder && node.data.folderData.id === selectedFolder.id;

  const toggleButton =
    node.data.children && node.data.children.length > 0 ? (
      <Button
        size="sm"
        className="bg-transparent rounded-full h-6 w-6 min-w-4"
        isIconOnly
        onPress={() => node.toggle()}
      >
        {node.isOpen ? <ChevronDown size={20} color="#F7C24E" /> : <ChevronRight size={20} color="#F7C24E" />}
      </Button>
    ) : null;

  const actions = (
    <>
      <Button
        size="sm"
        isIconOnly
        className="bg-transparent rounded-full"
        isDisabled={!context.isProjectDeveloper(Number(projectId))}
        onPress={() => openDialogForCreate(node.data.folderData.id)}
      >
        <Plus size={16} />
      </Button>
      <FolderEditMenu
        folder={node.data.folderData}
        isDisabled={!context.isProjectDeveloper(Number(projectId))}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        messages={messages}
      />
    </>
  );

  return (
    <TreeItem
      style={style}
      isSelected={isSelected}
      onClick={() => router.push(`/projects/${projectId}/folders/${node.data.folderData.id}/cases`, { locale })}
      toggleButton={toggleButton}
      icon={<Folder size={20} color="#F7C24E" fill="#F7C24E" className="flex-shrink-0" />}
      label={node.data.name}
      actions={actions}
    />
  );
}
