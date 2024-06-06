import { useState, useMemo, useCallback } from 'react';
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
import { Link, NextUiLinkClasses } from '@/src/navigation';
import { Plus, MoreVertical, Trash, Circle } from 'lucide-react';
import { CaseType, CasesMessages } from '@/types/case';
import { priorities } from '@/config/selection';

type Props = {
  projectId: string;
  isDisabled: boolean;
  cases: CaseType[];
  onCreateCase: () => void;
  onDeleteCase: (caseId: number) => void;
  onDeleteCases: (caseIds: number[]) => void;
  messages: CasesMessages;
  locale: string;
};

export default function TestCaseTable({
  projectId,
  isDisabled,
  cases,
  onCreateCase,
  onDeleteCase,
  onDeleteCases,
  messages,
  locale,
}: Props) {
  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.title, uid: 'title', sortable: true },
    { name: messages.priority, uid: 'priority', sortable: true },
    { name: messages.actions, uid: 'actions' },
  ];

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...cases].sort((a: Case, b: Case) => {
      const first = a[sortDescriptor.column as keyof Case] as number;
      const second = b[sortDescriptor.column as keyof Case] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, cases]);

  const handleDeleteCase = (deleteCaseId: number) => {
    onDeleteCase(deleteCaseId);
  };

  const renderCell = useCallback((testCase: Case, columnKey: Key) => {
    const cellValue = testCase[columnKey as keyof Case];

    switch (columnKey) {
      case 'id':
        return <span>{cellValue}</span>;
      case 'title':
        return (
          <Button size="sm" variant="light" className="data-[hover=true]:bg-transparent">
            <Link
              href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
              locale={locale}
              className={NextUiLinkClasses}
            >
              {cellValue}
            </Link>
          </Button>
        );
      case 'priority':
        return (
          <div className="flex items-center">
            <Circle size={8} color={priorities[cellValue].color} fill={priorities[cellValue].color} />
            <div className="ms-3">{messages[priorities[cellValue].uid]}</div>
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
            <DropdownMenu aria-label="test case actions">
              <DropdownItem
                className="text-danger"
                isDisabled={isDisabled}
                onPress={() => handleDeleteCase(testCase.id)}
              >
                {messages.deleteCase}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return cellValue;
    }
  }, []);

  const handleDeleteCases = () => {
    let deleteCaseIds: number[];
    if (selectedKeys === 'all') {
      deleteCaseIds = sortedItems.map((item) => item.id);
    } else {
      deleteCaseIds = Array.from(selectedKeys).map(Number);
    }
    onDeleteCases(deleteCaseIds);
    setSelectedKeys(new Set([]));
  };

  const classNames = useMemo(
    () => ({
      wrapper: ['max-w-3xl'],
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

  return (
    <>
      <div className="border-b-1 dark:border-neutral-700 w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.testCaseList}</h3>
        <div>
          {(selectedKeys.size > 0 || selectedKeys === 'all') && (
            <Button
              startContent={<Trash size={16} />}
              size="sm"
              isDisabled={isDisabled}
              color="danger"
              className="me-2"
              onPress={handleDeleteCases}
            >
              {messages.delete}
            </Button>
          )}
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            isDisabled={isDisabled}
            color="primary"
            onPress={onCreateCase}
          >
            {messages.newTestCase}
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
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={messages.noCasesFound} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
