import { Button, cn } from '@heroui/react';
import { ChevronDown, ChevronRight, Folder, Plus } from 'lucide-react';
import { NodeApi } from 'react-arborist';
import { useContext } from 'react';
import FolderEditMenu from './FolderEditMenu';
import { FolderType, FoldersMessages } from '@/types/folder';
import { useRouter } from '@/src/i18n/routing';
import { TokenContext } from '@/utils/TokenProvider';

interface TreeNodeData {
  id: string;
  name: string;
  detail?: string;
  parentFolderId: number | null;
  projectId: number;
  folderData: FolderType;
  children?: TreeNodeData[];
}

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

  const baseClass = '';
  const selectedClass = `${baseClass} bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 hover:bg-neutral-300`;

  return (
    <div className="mx-2">
      <div
        style={style}
        className={cn(
          'w-full py-2 pr-2 flex items-center justify-center rounded-md cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-600',
          isSelected ? selectedClass : baseClass
        )}
        onClick={() => {
          router.push(`/projects/${projectId}/folders/${node.data.folderData.id}/cases`, { locale });
        }}
      >
        {node.data.children && node.data.children.length > 0 ? (
          <Button size="sm" className="bg-transparent rounded-full" isIconOnly onPress={() => node.toggle()}>
            {node.isOpen ? <ChevronDown size={20} color="#F7C24E" /> : <ChevronRight size={20} color="#F7C24E" />}
          </Button>
        ) : (
          <div className="ml-2" />
        )}

        <Folder size={20} color="#F7C24E" fill="#F7C24E" />

        <span className="truncate ml-1.5">{node.data.name}</span>
        <div className="ml-auto flex items-center">
          <Button
            size="sm"
            isIconOnly
            className="bg-transparent rounded-full"
            isDisabled={!context.isProjectDeveloper(Number(projectId))}
            onPress={() => {
              openDialogForCreate(node.data.folderData.id);
            }}
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
        </div>
      </div>
    </div>
  );
}
