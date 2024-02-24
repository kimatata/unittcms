import { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Selection,
  SortDescriptor,
  Link,
} from "@nextui-org/react";
import { MoreVertical } from "lucide-react";

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Priority", uid: "priority", sortable: true },
  { name: "Actions", uid: "actions" },
];

const priorities = [
  { name: "Critical", uid: "critical", color: "danger" },
  { name: "High", uid: "high", color: "warning" },
  { name: "Medium", uid: "medium", color: "primary" },
  { name: "Low", uid: "low", color: "success" },
];

type Case = {
  id: number;
  title: string;
  state: number;
  priority: number;
  type: number;
  automationStatus: number;
  description: string;
  template: number;
  preConditions: string;
  expectedResults: string;
  folderId: number;
  createdAt: string;
  updatedAt: string;
};

export default function TestCaseTable({ projectId, cases }) {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });
  const headerColumns = columns;

  const sortedItems = useMemo(() => {
    return [...cases].sort((a: Case, b: Case) => {
      const first = a[sortDescriptor.column as keyof Case] as number;
      const second = b[sortDescriptor.column as keyof Case] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, cases]);
  const renderCell = useCallback((testCase: Case, columnKey: Key) => {
    const cellValue = testCase[columnKey as keyof Case];

    switch (columnKey) {
      case "id":
        return <span>{cellValue}</span>;
      case "title":
        return (
          <Link
            underline="hover"
            href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
          >
            {cellValue}
          </Link>
        );
      case "priority":
        return (
          <Chip
            className="border-none gap-1 text-default-600"
            color={priorities[cellValue].color}
            size="sm"
            variant="dot"
          >
            {priorities[cellValue].name}
          </Chip>
        );
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly radius="full" size="sm" variant="light">
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="test case actions">
              <DropdownItem>Edit test case</DropdownItem>
              <DropdownItem className="text-danger">
                Delete test case
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
    <Table
      isCompact
      removeWrapper
      aria-label="Tese cases table"
      classNames={classNames}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      onSelectionChange={setSelectedKeys}
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
  );
}