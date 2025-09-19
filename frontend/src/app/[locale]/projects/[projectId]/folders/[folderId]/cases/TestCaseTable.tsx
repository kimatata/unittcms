import { useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
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
  Badge,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@heroui/react';
import { Plus, MoreVertical, Trash, FileDown, ChevronDown, Filter, FileJson, FileSpreadsheet } from 'lucide-react';
import TestCaseFilter from './TestCaseFilter';
import { Link } from '@/src/i18n/routing';
import { CaseType, CasesMessages } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import TestCasePriority from '@/components/TestCasePriority';
import { LocaleCodeType } from '@/types/locale';
import useDebounce from '@/utils/useDebounce';
import { highlightSearchTerm } from '@/utils/highlightSearchTerm';

type Props = {
  projectId: string;
  isDisabled: boolean;
  cases: CaseType[];
  onCreateCase: () => void;
  onDeleteCase: (caseId: number) => void;
  onDeleteCases: (caseIds: number[]) => void;
  onExportCases: (type: string) => void;
  onFilterChange: (priorities: number[], types: number[]) => void;
  onQueryChange: (q: string) => void;
  queryTerm: string;
  activePriorityFilters: number[];
  activeTypeFilters: number[];
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  locale: LocaleCodeType;
  isSearching: boolean;
};

export default function TestCaseTable({
  projectId,
  isDisabled,
  cases,
  onCreateCase,
  onDeleteCase,
  onDeleteCases,
  onExportCases,
  onFilterChange,
  onQueryChange,
  activePriorityFilters,
  activeTypeFilters,
  messages,
  priorityMessages,
  testTypeMessages,
  locale,
  queryTerm,
  isSearching,
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
  const [showFilter, setShowFilter] = useState(false);
  const [localQueryTerm, setLocalQueryTerm] = useState(queryTerm);

  const debouncedQuery = useDebounce((value: unknown) => {
    onQueryChange(value as string);
  }, 500);

  useEffect(() => {
    setLocalQueryTerm(queryTerm);
  }, [queryTerm]);

  const sortedItems = useMemo(() => {
    if (cases.length === 0) {
      return [];
    }
    return [...cases].sort((a: CaseType, b: CaseType) => {
      const first = a[sortDescriptor.column as keyof CaseType] as number;
      const second = b[sortDescriptor.column as keyof CaseType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, cases]);

  const handleDeleteCase = (deleteCaseId: number) => {
    onDeleteCase(deleteCaseId);
  };

  const handleQueryChange = (value: string) => {
    setLocalQueryTerm(value);
    if (value.length >= 2 || value.length === 0) {
      debouncedQuery(value);
    }
  };

  const renderCell = useCallback(
    (testCase: CaseType, columnKey: string): ReactNode => {
      const cellValue = testCase[columnKey as keyof CaseType];

      switch (columnKey) {
        case 'id':
          return <span>{cellValue as number}</span>;
        case 'title':
          return (
            <Button
              size="sm"
              as={Link}
              href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
              locale={locale}
              variant="light"
              className="data-[hover=true]:bg-transparent gap-0"
            >
              {highlightSearchTerm({
                text: cellValue as string,
                searchTerm: localQueryTerm,
              })}
            </Button>
          );
        case 'priority':
          return <TestCasePriority priorityValue={cellValue as number} priorityMessages={priorityMessages} />;
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
                  key="delete-case"
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
          return cellValue as string;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localQueryTerm]
  );

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

  const hasActiveFilters = activePriorityFilters.length > 0 || activeTypeFilters.length > 0;

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
      <div className="border-b-1 dark:border-neutral-700 w-full ">
        <div className="flex items-center justify-between p-3 ">
          <h3 className="font-bold">{messages.testCaseList}</h3>
          <div className="flex items-center">
            {((selectedKeys !== 'all' && selectedKeys.size > 0) || selectedKeys === 'all') && (
              <Button
                startContent={<Trash size={16} />}
                size="sm"
                variant="bordered"
                isDisabled={isDisabled}
                color="danger"
                className="me-2"
                onPress={handleDeleteCases}
              >
                {messages.delete}
              </Button>
            )}
            {/* <Input
              className="me-2"
              variant="bordered"
              classNames={{
                base: 'max-w-full sm:max-w-[12rem] h-8',
                mainWrapper: 'h-full',
                input: 'text-small',
              }}
              placeholder={messages.searchPlaceholder}
              size="sm"
              startContent={<SearchIcon size={18} />}
              endContent={isSearching && <Spinner size="sm" />}
              type="search"
              value={localQueryTerm}
              onValueChange={handleQueryChange}
              aria-label={messages.searchPlaceholder}
              maxLength={100}
            /> */}
            <Popover placement="bottom" isOpen={showFilter} onOpenChange={(open) => setShowFilter(open)}>
              <Badge
                color="warning"
                content=""
                isInvisible={!hasActiveFilters}
                shape="circle"
                size="sm"
                placement="bottom-left"
              >
                <PopoverTrigger>
                  <Button size="sm" variant="bordered" isIconOnly className="me-2">
                    <Filter size={16} />
                  </Button>
                </PopoverTrigger>
              </Badge>
              <PopoverContent>
                <TestCaseFilter
                  messages={messages}
                  priorityMessages={priorityMessages}
                  testTypeMessages={testTypeMessages}
                  isSearching={isSearching}
                  localQueryTerm={localQueryTerm}
                  activePriorityFilters={activePriorityFilters}
                  activeTypeFilters={activeTypeFilters}
                  onQueryChange={handleQueryChange}
                  onFilterChange={onFilterChange}
                />
              </PopoverContent>
            </Popover>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  size="sm"
                  variant="bordered"
                  className="me-2"
                  startContent={<FileDown size={16} />}
                  endContent={<ChevronDown size={16} />}
                >
                  {messages.export}
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Export options">
                <DropdownItem key="json" startContent={<FileJson size={16} />} onPress={() => onExportCases('json')}>
                  json
                </DropdownItem>
                <DropdownItem
                  key="csv"
                  startContent={<FileSpreadsheet size={16} />}
                  onPress={() => onExportCases('csv')}
                >
                  csv
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
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
      </div>

      <Table
        isCompact
        removeWrapper
        aria-label="Test cases table"
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
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey as string)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
