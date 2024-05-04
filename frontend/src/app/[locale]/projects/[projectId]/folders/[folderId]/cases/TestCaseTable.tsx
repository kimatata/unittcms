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
  Selection,
  SortDescriptor,
} from "@nextui-org/react";
import { Link, NextUiLinkClasses } from "@/src/navigation";
import { Plus, MoreVertical, Trash, Circle } from "lucide-react";

const headerColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Priority", uid: "priority", sortable: true },
  { name: "Actions", uid: "actions" },
];

import { priorities } from "@/config/selection";

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

type Props = {
  projectId: string;
  cases: Case[];
  onCreateCase: () => void;
  onDeleteCase: (caseId: number) => void;
  onDeleteCases: (selectedCases: string[]) => void;
  locale: string;
};

export default function TestCaseTable({
  projectId,
  cases,
  onCreateCase,
  onDeleteCase,
  onDeleteCases,
  locale,
}: Props) {
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

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
            href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
            locale={locale}
            className={NextUiLinkClasses}
          >
            {cellValue}
          </Link>
        );
      case "priority":
        return (
          <div className="flex items-center">
            <Circle
              size={8}
              color={priorities[cellValue].color}
              fill={priorities[cellValue].color}
            />
            <div className="ms-3">{priorities[cellValue].name}</div>
          </div>
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
              <DropdownItem
                className="text-danger"
                onClick={() => onDeleteCase(testCase.id)}
              >
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

  const onDeleteCasesClick = async () => {
    if (selectedKeys === "all") {
      const allKeys = sortedItems.map((item) => item.id);
      onDeleteCases(allKeys);
    } else {
      onDeleteCases([...selectedKeys]);
    }
    setSelectedKeys(new Set([]));
  };

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">Cases</h3>
        <div>
          {(selectedKeys.size > 0 || selectedKeys === "all") && (
            <Button
              startContent={<Trash size={16} />}
              size="sm"
              color="danger"
              className="me-2"
              onClick={onDeleteCasesClick}
            >
              Delete
            </Button>
          )}
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            color="primary"
            onClick={onCreateCase}
          >
            New Test Case
          </Button>
        </div>
      </div>

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
    </>
  );
}
