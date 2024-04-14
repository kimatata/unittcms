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
import { priorities, testRunCaseStatus } from "@/config/selection";
import { CaseType } from "@/types/case";

const headerColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Priority", uid: "priority", sortable: true },
  { name: "isIncluded", uid: "isIncluded", sortable: true },
  { name: "Status", uid: "runStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

type Props = {
  projectId: string;
  cases: CaseType[];
  selectedKeys: Selection;
  onSelectionChange: React.Dispatch<React.SetStateAction<Selection>>;
};

export default function TestCaseSelector({
  projectId,
  cases,
  selectedKeys,
  onSelectionChange,
}: Props) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const sortedItems = useMemo(() => {
    return [...cases].sort((a: CaseType, b: CaseType) => {
      const first = a[sortDescriptor.column as keyof CaseType] as number;
      const second = b[sortDescriptor.column as keyof CaseType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, cases]);
  const renderCell = useCallback((testCase: CaseType, columnKey: Key) => {
    const cellValue = testCase[columnKey as keyof CaseType];
    // console.log(columnKey, cellValue)

    switch (columnKey) {
      case "id":
        return <span>{cellValue}</span>;
      case "title":
        return (
          <Link
            underline="hover"
            href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
            className="dark:text-white"
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
      case "isIncluded":
        const flag = cellValue ? "true" : "false"
        return <span>{flag}</span>;
      case "runStatus":
        return (
          <Chip
            className="border-none gap-1 text-default-600"
            color={testRunCaseStatus[cellValue].color}
            size="sm"
            variant="dot"
          >
            {testRunCaseStatus[cellValue].name}
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
              <DropdownItem className="text-danger" onClick={() => {}}>
                status change
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
      wrapper: ["min-w-3xl"],
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

  const handleSelectionChange = (keys: Selection) => {
    onSelectionChange(keys);
  };

  return (
    <>
      <Table
        isCompact
        removeWrapper
        aria-label="Tese cases table"
        classNames={classNames}
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={sortDescriptor}
        onSelectionChange={handleSelectionChange}
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
