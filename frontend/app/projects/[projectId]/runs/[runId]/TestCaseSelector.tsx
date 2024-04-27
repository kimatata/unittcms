import { useState, useMemo } from "react";
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
import {
  ChevronDown,
  MoreVertical,
  CopyPlus,
  CopyMinus,
  Circle,
  CircleCheck,
  CircleX,
  CircleSlash2,
} from "lucide-react";
import { priorities, testRunCaseStatus } from "@/config/selection";
import { CaseType } from "@/types/case";

const headerColumns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Title", uid: "title", sortable: true },
  { name: "Priority", uid: "priority", sortable: true },
  { name: "Status", uid: "runStatus", sortable: true },
  { name: "Actions", uid: "actions" },
];

type Props = {
  cases: CaseType[];
  selectedKeys: Selection;
  onSelectionChange: React.Dispatch<React.SetStateAction<Selection>>;
  onStatusChange: (changeCaseId: number, status: number) => {};
  onIncludeCase: (includeCaseId: number) => {};
  onExcludeCase: (excludeCaseId: number) => {};
};

export default function TestCaseSelector({
  cases,
  selectedKeys,
  onSelectionChange,
  onStatusChange,
  onIncludeCase,
  onExcludeCase,
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

  const notIncludedCaseClass = "text-neutral-200 dark:text-neutral-600";
  const chipBaseClass = "flex items-center text-default-600";

  const renderStatusIcon = (uid: string) => {
    if (uid === "untested") {
      return <Circle size={16} color="#d4d4d8" />;
    } else if (uid === "passed") {
      return <CircleCheck size={16} color="#17c964" />;
    } else if (uid === "failed") {
      return <CircleX size={16} color="#f31260" />;
    } else if (uid === "skipped") {
      return <CircleSlash2 size={16} color="#52525b" />;
    }
  };

  const renderCell = (testCase: CaseType, columnKey: Key) => {
    const cellValue = testCase[columnKey as keyof CaseType];
    const isIncluded = testCase.isIncluded;

    switch (columnKey) {
      case "priority":
        return (
          <div
            className={
              isIncluded ? chipBaseClass : chipBaseClass + notIncludedCaseClass
            }
          >
            <Circle
              size={8}
              color={isIncluded ? priorities[cellValue].color : "#d4d4d8"}
              fill={isIncluded ? priorities[cellValue].color : "#d4d4d8"}
            />
            <div className="ms-3">{priorities[cellValue].name}</div>
          </div>
        );
      case "runStatus":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="light"
                isDisabled={!isIncluded}
                startContent={
                  isIncluded &&
                  renderStatusIcon(testRunCaseStatus[cellValue].uid)
                }
                endContent={isIncluded && <ChevronDown size={16} />}
              >
                <span className="w-12">
                  {isIncluded && testRunCaseStatus[cellValue].name}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="test case actions">
              {testRunCaseStatus.map((runCaseStatus, index) => (
                <DropdownItem
                  key={index}
                  startContent={renderStatusIcon(runCaseStatus.uid)}
                  onPress={() => onStatusChange(testCase.id, index)}
                >
                  {runCaseStatus.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        );
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly radius="full" size="sm" variant="light">
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="include or exclude actions">
              <DropdownItem
                startContent={<CopyPlus size={16} />}
                isDisabled={testCase.isIncluded}
                onPress={() => onIncludeCase(testCase.id)}
              >
                Include in run
              </DropdownItem>
              <DropdownItem
                startContent={<CopyMinus size={16} />}
                isDisabled={!testCase.isIncluded}
                onPress={() => onExcludeCase(testCase.id)}
              >
                Exclude from run
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return cellValue;
    }
  };

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
            <TableRow
              key={item.id}
              className={!item.isIncluded ? notIncludedCaseClass : ""}
            >
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
