import React from "react";
import {
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardHeader,
  CardBody,
  Divider,
} from "@nextui-org/react";
import { MoreVertical } from "lucide-react";

export function ProjectCard({ project, onEditClick, onDeleteClick }) {
  return (
    <Card className="w-[250px]">
      <CardHeader className="flex gap-3 h-[50px] justify-between text-ellipsis overflow-hidden">
        <div className="flex gap-5">
          <div className="flex flex-col gap-1 items-start justify-center">
            <Link href={`/projects/${project.id}/dashboard`}>{project.name}</Link>
          </div>
        </div>
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly size="sm" className="bg-transparent rounded-full">
              <MoreVertical size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Static Actions">
            <DropdownItem key="edit" onClick={() => onEditClick(project)}>
              Edit project
            </DropdownItem>
            <DropdownItem
              key="delete"
              className="text-danger"
              color="danger"
              onClick={() => onDeleteClick(project.id)}
            >
              Delete project
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <Divider />
      <CardBody className="h-[50px] text-ellipsis overflow-hidden">
        <p>{project.detail}</p>
      </CardBody>
    </Card>
  );
}
