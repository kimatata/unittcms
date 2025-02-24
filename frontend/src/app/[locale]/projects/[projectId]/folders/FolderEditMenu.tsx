import { useState, useEffect } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
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
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isDisabled) {
      setDisabledKeys(['edit', 'delete']);
    } else {
      setDisabledKeys([]);
    }
  }, [isDisabled]);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" className="bg-transparent rounded-full">
          <MoreVertical size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions" disabledKeys={disabledKeys}>
        <DropdownItem key="edit" onPress={() => onEditClick(folder)}>
          {messages.editFolder}
        </DropdownItem>
        <DropdownItem key="delete" className="text-danger" color="danger" onPress={() => onDeleteClick(folder.id)}>
          {messages.deleteFolder}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
