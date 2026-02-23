import { useState, useEffect, useMemo, ReactNode } from 'react';
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
  Chip,
} from '@heroui/react';
import { ChevronDown, MoreVertical, CopyPlus, CopyMinus, MessageCircle } from 'lucide-react';
import RunCaseStatus from './RunCaseStatus';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { testRunCaseStatus } from '@/config/selection';
import { CaseType } from '@/types/case';
import { RunMessages } from '@/types/run';
import { PriorityMessages } from '@/types/priority';
import TestCasePriority from '@/components/TestCasePriority';
import { TestTypeMessages } from '@/types/testType';
import { TestRunCaseStatusMessages } from '@/types/status';

type Props = {
  projectId: string;
  runId: string;
  locale: string;
  cases: CaseType[];
  isDisabled: boolean;
  selectedKeys: Selection;
  onSelectionChange: React.Dispatch<React.SetStateAction<Selection>>;
  onChangeStatus: (changeCaseId: number, status: number) => void;
  onIncludeCase: (includeCaseId: number) => void;
  onExcludeCase: (excludeCaseId: number) => void;
  messages: RunMessages;
  testRunCaseStatusMessages: TestRunCaseStatusMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
};

export default function TestCaseSelector({
  projectId,
  runId,
  locale,
  cases,
  isDisabled,
  selectedKeys,
  onSelectionChange,
  onChangeStatus,
  onIncludeCase,
  onExcludeCase,
  messages,
  testRunCaseStatusMessages,
  priorityMessages,
}: Props) {
  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.title, uid: 'title', sortable: true },
    { name: messages.priority, uid: 'priority', sortable: true },
    { name: messages.tags, uid: 'tags', sortable: false },
    { name: messages.status, uid: 'runStatus', sortable: true },
    { name: messages.comments, uid: 'comments', sortable: false },
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
  const renderCell = (testCase: CaseType, columnKey: string): ReactNode => {
    const cellValue = testCase[columnKey as keyof CaseType];
    const isIncluded = isCaseIncluded(testCase);
    const runStatus = testCase.RunCases && testCase.RunCases.length > 0 ? testCase.RunCases[0].status : 0;
    const commentCount = testCase.RunCases && testCase.RunCases.length > 0 ? testCase.RunCases[0].commentCount || 0 : 0;

    switch (columnKey) {
      case 'title':
        return (
          <div className={isIncluded ? '' : notIncludedCaseClass}>
            <Link
              href={`/projects/${projectId}/runs/${runId}/cases/${testCase.id}`}
              locale={locale}
              className={NextUiLinkClasses}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {cellValue as string}
            </Link>
          </div>
        );
      case 'priority':
        return (
          <div className={isIncluded ? '' : notIncludedCaseClass}>
            <TestCasePriority priorityValue={cellValue as number} priorityMessages={priorityMessages} />
          </div>
        );
      case 'tags':
        return (
          <div className={`flex gap-1 flex-wrap ${isIncluded ? '' : notIncludedCaseClass}`}>
            {testCase.Tags && testCase.Tags.length > 0 ? (
              testCase.Tags.map((tag) => (
                <Chip key={tag.id} size="sm" variant="flat">
                  {tag.name}
                </Chip>
              ))
            ) : (
              <span>-</span>
            )}
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
                startContent={isIncluded && <RunCaseStatus uid={testRunCaseStatus[runStatus].uid} />}
                endContent={isIncluded && <ChevronDown size={16} />}
              >
                <span className="w-12">
                  {isIncluded && testRunCaseStatusMessages[testRunCaseStatus[runStatus].uid]}
                </span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu disabledKeys={disabledStatusKeys} aria-label="test case actions">
              {testRunCaseStatus.map((runCaseStatus, index) => (
                <DropdownItem
                  key={runCaseStatus.uid}
                  startContent={<RunCaseStatus uid={runCaseStatus.uid} />}
                  onPress={() => onChangeStatus(testCase.id, index)}
                >
                  {testRunCaseStatusMessages[runCaseStatus.uid]}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        );
      case 'comments':
        return (
          <div className={isIncluded ? '' : notIncludedCaseClass}>
            {isIncluded && commentCount > 0 ? (
              <Link
                href={`/projects/${projectId}/runs/${runId}/cases/${testCase.id}?tab=comments`}
                locale={locale}
                className="flex items-center gap-1"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <MessageCircle size={16} />
                <span>{commentCount}</span>
              </Link>
            ) : (
              <span className="text-default-400">-</span>
            )}
          </div>
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
        return cellValue as string;
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
