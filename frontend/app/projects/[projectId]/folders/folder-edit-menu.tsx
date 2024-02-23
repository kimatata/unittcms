import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { MoreVertical } from "lucide-react";
import { FolderType } from "./layout";

export default function FolderEditMenu(
  folder: FolderType,
  onEditClick: (folder: FolderType) => void,
  onDeleteClick: (folderId: number) => void
) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly size="sm" className="bg-transparent rounded-full">
          <MoreVertical size={16} />
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Static Actions">
        <DropdownItem key="edit" onClick={() => onEditClick(folder)}>
          Edit folder
        </DropdownItem>
        <DropdownItem
          key="delete"
          className="text-danger"
          color="danger"
          onClick={() => onDeleteClick(folder.id)}
        >
          Delete folder
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
