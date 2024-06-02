import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { MoreVertical } from 'lucide-react';
import { FolderType, FoldersMessages } from '@/types/folder';

type Props = {
  folder: FolderType;
  isDisabled: boolean;
  onEditClick: (folder: FolderType) => void;
  onDeleteClick: (deleteFolderId: number) => void;
  messages: FoldersMessages;
};

export default function FolderEditMenu({ folder, isDisabled, onEditClick, onDeleteClick, messages }: Props) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly isDisabled={isDisabled} size="sm" className="bg-transparent rounded-full">
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
