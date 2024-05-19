import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { MoreVertical } from 'lucide-react';
import { FolderType, FoldersMessages } from '@/types/folder';

type Props = {
  folder: FolderType;
  onEditClick: (folder: FolderType) => void;
  onDeleteClick: (folder: FolderType) => void;
  messages: FoldersMessages;
};

export default function FolderEditMenu({ folder, onEditClick, onDeleteClick, messages }: Props) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" className="bg-transparent rounded-full">
          <MoreVertical size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="edit" onClick={() => onEditClick(folder)}>
          {messages.editFolder}
        </DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => onDeleteClick(folder.id)}>
          {messages.deleteFolder}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
