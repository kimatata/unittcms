import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  SortDescriptor,
  Link,
} from "@nextui-org/react";
import { MoreVertical } from "lucide-react";
import { ProjectType } from "@/types/project";
import dayjs from "dayjs";

const headerColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Name", uid: "name", sortable: true },
  { name: "Detail", uid: "detail", sortable: true },
  { name: "Last update", uid: "updatedAt", sortable: true },
  { name: "Actions", uid: "actions" },
];

type Props = {
  projects: ProjectType[];
  onEditProject: (project: ProjectType) => void;
  onDeleteProject: (projectId: number) => void;
};

export default function ProjectsTable({
  projects,
  onEditProject,
  onDeleteProject,
}: Props) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const sortedItems = useMemo(() => {
    return [...projects].sort((a: ProjectType, b: ProjectType) => {
      const first = a[sortDescriptor.column as keyof ProjectType] as number;
      const second = b[sortDescriptor.column as keyof ProjectType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, projects]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const renderCell = useCallback((project: ProjectType, columnKey: Key) => {
    const cellValue = project[columnKey as keyof ProjectType];

    switch (columnKey) {
      case "id":
        return <span>{cellValue}</span>;
      case "name":
        return (
          <Link
            underline="hover"
            href={`/projects/${project.id}/home`}
            className="text-blue-500"
          >
            {cellValue}
          </Link>
        );
      case "detail":
        const maxLength = 20;
        const truncatedValue = truncateText(cellValue, maxLength);
        return (
          <div className="flex items-center space-x-2">
            <div>{truncatedValue}</div>
          </div>
        );
      case "updatedAt":
        return <span>{dayjs(cellValue).format("YYYY/MM/DD HH:mm")}</span>;
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly radius="full" size="sm" variant="light">
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="project actions">
              <DropdownItem onClick={() => onEditProject(project)}>
                Edit project
              </DropdownItem>
              <DropdownItem
                className="text-danger"
                onClick={() => onDeleteProject(project.id)}
              >
                Delete project
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return cellValue;
    }
  }, []);

  const classNames = useMemo(
    () => ({
      wrapper: ["max-w-3xl"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        // changing the rows border radius
        // first
        "group-data-[first=true]:first:before:rounded-none",
        "group-data-[first=true]:last:before:rounded-none",
        // middle
        "group-data-[middle=true]:before:rounded-none",
        // last
        "group-data-[last=true]:first:before:rounded-none",
        "group-data-[last=true]:last:before:rounded-none",
      ],
    }),
    []
  );

  return (
    <>
      <Table
        isCompact
        aria-label="Projects table"
        classNames={classNames}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No cases found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
