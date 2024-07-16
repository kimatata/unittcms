import { useState, useEffect, useMemo } from 'react';
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
} from '@nextui-org/react';
import {
  ChevronDown,
  MoreVertical,
  CopyPlus,
  CopyMinus,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleX,
  CircleSlash2,
} from 'lucide-react';
import { priorities, testRunCaseStatus } from '@/config/selection';
import { CaseType } from '@/types/case';
import { RunMessages } from '@/types/run';

type Props = {
  cases: CaseType[];
  isDisabled: boolean;
  selectedKeys: Selection;
  onSelectionChange: React.Dispatch<React.SetStateAction<Selection>>;
  onStatusChange: (changeCaseId: number, status: number) => {};
  onIncludeCase: (includeCaseId: number) => {};
  onExcludeCase: (excludeCaseId: number) => {};
  messages: RunMessages;
};

export default function TestCaseSelector({
  cases,
  isDisabled,
  selectedKeys,
  onSelectionChange,
  onStatusChange,
  onIncludeCase,
  onExcludeCase,
  messages,
}: Props) {
  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.title, uid: 'title', sortable: true },
    { name: messages.priority, uid: 'priority', sortable: true },
    { name: messages.status, uid: 'runStatus', sortable: true },
    { name: messages.actions, uid: 'actions' },
  ];

  const [disabledStatusKeys, setDisabledStatusKeys] = useState<string[]>([]);
  const [disabledIncludeExcludeKeys, setDisabledIncludeExcludeKeys] = useState<string[]>([]);
  useEffect(() => {
    if (isDisabled) {
      setDisabledStatusKeys(
        testRunCaseStatus.map((entry) => {
          return entry.uid;
        })
      );
      setDisabledIncludeExcludeKeys(['include', 'exclude']);
    } else {
      setDisabledStatusKeys([]);
      setDisabledIncludeExcludeKeys([]);
    }
  }, [isDisabled]);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...cases].sort((a: CaseType, b: CaseType) => {
      const first = a[sortDescriptor.column as keyof CaseType] as number;
      const second = b[sortDescriptor.column as keyof CaseType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, cases]);

  const notIncludedCaseClass = 'text-neutral-200 dark:text-neutral-600';
  const chipBaseClass = 'flex items-center text-default-600';

  const renderStatusIcon = (uid: string) => {
    if (uid === 'untested') {
      return <Circle size={16} color="#d4d4d8" />;
    } else if (uid === 'passed') {
      return <CircleCheck size={16} color="#17c964" />;
    } else if (uid === 'retest') {
      return <CircleDashed size={16} color="#f5a524" />;
    } else if (uid === 'failed') {
      return <CircleX size={16} color="#f31260" />;
    } else if (uid === 'skipped') {
      return <CircleSlash2 size={16} color="#52525b" />;
    }
  };

  const isCaseIncluded = (testCase: CaseType) => {
    let isIncluded = false;
    if (testCase.RunCases && testCase.RunCases.length > 0) {
      if (testCase.RunCases[0].editState !== 'deleted') {
        // Even if RunCase[0] exists, if 'deleted' it will be as not included.
        isIncluded = true;
      }
    }

    return isIncluded;
  };

  const renderCell = (testCase: CaseType, columnKey: Key) => {
    const cellValue = testCase[columnKey as keyof CaseType];
    const isIncluded = isCaseIncluded(testCase);
    const runStatus = testCase.RunCases && testCase.RunCases.length > 0 ? testCase.RunCases[0].status : 0;

    switch (columnKey) {
      case 'priority':
        return (
          <div className={isIncluded ? chipBaseClass : chipBaseClass + notIncludedCaseClass}>
            <Circle
              size={8}
              color={isIncluded ? priorities[cellValue].color : '#d4d4d8'}
              fill={isIncluded ? priorities[cellValue].color : '#d4d4d8'}
            />
            <div className="ms-3">{messages[priorities[cellValue].uid]}</div>
          </div>
        );
      case 'runStatus':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                variant="light"
                isDisabled={!isIncluded}
                startContent={isIncluded && renderStatusIcon(testRunCaseStatus[runStatus].uid)}
                endContent={isIncluded && <ChevronDown size={16} />}
              >
                <span className="w-12">{isIncluded && messages[testRunCaseStatus[runStatus].uid]}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu disabledKeys={disabledStatusKeys} aria-label="test case actions">
              {testRunCaseStatus.map((runCaseStatus, index) => (
                <DropdownItem
                  key={runCaseStatus.uid}
                  startContent={renderStatusIcon(runCaseStatus.uid)}
                  onPress={() => onStatusChange(testCase.id, index)}
                >
                  {messages[runCaseStatus.uid]}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        );
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly radius="full" size="sm" variant="light">
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu disabledKeys={disabledIncludeExcludeKeys} aria-label="include or exclude actions">
              <DropdownItem
                key="include"
                startContent={<CopyPlus size={16} />}
                onPress={() => {
                  if (isIncluded) {
                    return;
                  }
                  onIncludeCase(testCase.id);
                }}
              >
                {messages.includeInRun}
              </DropdownItem>
              <DropdownItem
                key="exclude"
                startContent={<CopyMinus size={16} />}
                onPress={() => {
                  if (!isIncluded) {
                    return;
                  }
                  onExcludeCase(testCase.id);
                }}
              >
                {messages.excludeFromRun}
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
      wrapper: ['min-w-3xl'],
      th: ['bg-transparent', 'text-default-500', 'border-b', 'border-divider'],
      td: [
        // changing the rows border radius
        // first
        'group-data-[first=true]:first:before:rounded-none',
        'group-data-[first=true]:last:before:rounded-none',
        // middle
        'group-data-[middle=true]:before:rounded-none',
        // last
        'group-data-[last=true]:first:before:rounded-none',
        'group-data-[last=true]:last:before:rounded-none',
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
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={messages.noCasesFound}>
          {sortedItems.map((item) => (
            <TableRow key={item.id} className={isCaseIncluded(item) ? '' : notIncludedCaseClass}>
              {headerColumns.map((column) => (
                <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
