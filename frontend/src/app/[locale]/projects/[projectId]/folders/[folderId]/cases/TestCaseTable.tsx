import { useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import {
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
  Checkbox,
  Card,
  CardBody,
  Chip,
} from '@heroui/react';
import {
  Plus,
  MoreVertical,
  Trash,
  FileUp,
  FileDown,
  ChevronUp,
  ChevronDown,
  Filter,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { table } from '@heroui/theme';
import TestCaseFilter from './TestCaseFilter';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { CaseType, CasesMessages } from '@/types/case';
import { PriorityMessages } from '@/types/priority';
import { TestTypeMessages } from '@/types/testType';
import TestCasePriority from '@/components/TestCasePriority';
import { LocaleCodeType } from '@/types/locale';
import { highlightSearchTerm } from '@/utils/highlightSearchTerm';
import { onMoveEvent } from '@/utils/testCaseMoveEvent';

type Props = {
  projectId: string;
  isDisabled: boolean;
  cases: CaseType[];
  onCreateCase: () => void;
  onDeleteCase: (caseId: number) => void;
  onDeleteCases: (caseIds: number[]) => void;
  onShowImportDialog: () => void;
  onExportCases: (type: string) => void;
  onFilterChange: (query: string, priorities: number[], types: number[], tag: number[]) => void;
  activeSearchFilter: string;
  activePriorityFilters: number[];
  activeTypeFilters: number[];
  activeTagFilters: number[];
  messages: CasesMessages;
  priorityMessages: PriorityMessages;
  testTypeMessages: TestTypeMessages;
  locale: LocaleCodeType;
};

export default function TestCaseTable({
  projectId,
  isDisabled,
  cases,
  onCreateCase,
  onDeleteCase,
  onDeleteCases,
  onShowImportDialog,
  onExportCases,
  onFilterChange,
  activeSearchFilter,
  activePriorityFilters,
  activeTypeFilters,
  activeTagFilters,
  messages,
  priorityMessages,
  testTypeMessages,
  locale,
}: Props) {
  const heroUITableClasses = table();
  const thClassNames = 'bg-transparent text-default-500 border-b border-divider';
  const tdClassNames =
    '!py-1 group-data-[first=true]:first:before:rounded-none group-data-[first=true]:last:before:rounded-none group-data-[middle=true]:before:rounded-none group-data-[last=true]:first:before:rounded-none group-data-[last=true]:last:before:rounded-none';

  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.title, uid: 'title', sortable: true },
    { name: messages.priority, uid: 'priority', sortable: true },
    { name: messages.tags, uid: 'tags' },
    { name: messages.actions, uid: 'actions' },
  ];

  const renderCell = useCallback(
    (testCase: CaseType, columnKey: string): ReactNode => {
      const cellValue = testCase[columnKey as keyof CaseType];

      switch (columnKey) {
        case 'id':
          return <span>{cellValue as number}</span>;
        case 'title':
          return (
            <Link
              href={`/projects/${projectId}/folders/${testCase.folderId}/cases/${testCase.id}`}
              locale={locale}
              className={NextUiLinkClasses}
              draggable="false"
            >
              {highlightSearchTerm({
                text: cellValue as string,
                searchTerm: activeSearchFilter,
              })}
            </Link>
          );
        case 'priority':
          return <TestCasePriority priorityValue={cellValue as number} priorityMessages={priorityMessages} />;

        case 'tags':
          return (
            <div className="space-x-2">
              {testCase.Tags?.map((tag) => (
                <Chip size="sm" key={tag.id}>
                  {tag.name}
                </Chip>
              ))}
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
    [activeSearchFilter]
  );

  // **************************************************************************
  // filter test case
  // **************************************************************************
  const [showFilter, setShowFilter] = useState(false);
  const activeFilterNum =
    (activeSearchFilter ? 1 : 0) + activePriorityFilters.length + activeTypeFilters.length + activeTagFilters.length;

  // **************************************************************************
  // select test case
  // **************************************************************************
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const handleSelectRow = (id: number) => {
    setSelectedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedKeys !== 'all' && selectedKeys instanceof Set && selectedKeys.size === sortedItems.length) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(sortedItems.map((item) => item.id)));
    }
  };

  const isSelected = (id: number) => {
    return selectedKeys === 'all' || (selectedKeys instanceof Set && selectedKeys.has(id));
  };

  const isSelectedAll = () => {
    return (
      (selectedKeys === 'all' && sortedItems.length > 0) ||
      (selectedKeys instanceof Set && selectedKeys.size === sortedItems.length && sortedItems.length > 0)
    );
  };

  // **************************************************************************
  // sort test case
  // **************************************************************************
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });
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
  const handleSort = (columnUid: string) => {
    setSortDescriptor((prev) => {
      if (prev.column === columnUid) {
        return {
          column: columnUid,
          direction: prev.direction === 'ascending' ? 'descending' : 'ascending',
        };
      }
      return { column: columnUid, direction: 'ascending' };
    });
  };

  const handleDeleteCase = (deleteCaseId: number) => {
    onDeleteCase(deleteCaseId);
  };

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

  // **************************************************************************
  // move test case
  // **************************************************************************
  const [dragCount, setDragCount] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.stopPropagation();

    let selectedIds: number[];
    if (selectedKeys === 'all' || (selectedKeys instanceof Set && selectedKeys.has(id) && selectedKeys.size > 1)) {
      // when multiple row selected
      selectedIds =
        selectedKeys === 'all' ? sortedItems.map((item) => item.id) : (Array.from(selectedKeys) as number[]);
    } else {
      // when no row selected or only one row selected
      selectedIds = [id];
    }
    setDragCount(selectedIds.length);
    e.dataTransfer.setData('application/json', JSON.stringify(selectedIds));
    const img = new window.Image();
    img.src = 'data:image/svg+xml;base64,';
    e.dataTransfer.setDragImage(img, 0, 0);
  };
  const handleDrag = (e: React.DragEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleDragEnd = () => {
    setDragCount(null);
  };
  useEffect(() => {
    const unsubscribe = onMoveEvent(() => {
      handleDragEnd();
    });
    return unsubscribe;
  }, []);

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
            <Popover placement="bottom" isOpen={showFilter} onOpenChange={(open) => setShowFilter(open)}>
              <Badge
                color="danger"
                content={activeFilterNum}
                isInvisible={activeFilterNum === 0}
                shape="circle"
                placement="top-left"
              >
                <PopoverTrigger>
                  <Button
                    startContent={<Filter size={16} />}
                    endContent={<ChevronDown size={16} />}
                    size="sm"
                    variant="bordered"
                    className="me-2"
                  >
                    {messages.filter}
                  </Button>
                </PopoverTrigger>
              </Badge>
              <PopoverContent>
                <TestCaseFilter
                  messages={messages}
                  priorityMessages={priorityMessages}
                  testTypeMessages={testTypeMessages}
                  activeSearchFilter={activeSearchFilter}
                  activePriorityFilters={activePriorityFilters}
                  activeTypeFilters={activeTypeFilters}
                  activeTagFilters={activeTagFilters}
                  projectId={projectId}
                  onFilterChange={(newTitleFilter, newPriorityFilters, newTypeFilters, newTagFilters) => {
                    setShowFilter(false);
                    onFilterChange(newTitleFilter, newPriorityFilters, newTypeFilters, newTagFilters);
                  }}
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
              startContent={<FileUp size={16} />}
              size="sm"
              variant="bordered"
              className="me-2"
              onPress={onShowImportDialog}
            >
              {messages.import}
            </Button>
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

      <div>
        <table className={heroUITableClasses.table()}>
          <thead className={heroUITableClasses.thead()}>
            <tr className={heroUITableClasses.tr()}>
              <th className={`${heroUITableClasses.th()} ${thClassNames}`}>
                <Checkbox isSelected={isSelectedAll()} onChange={handleSelectAll} />
              </th>
              {headerColumns.map((column) => (
                <th
                  key={column.uid}
                  className={`${heroUITableClasses.th()} ${thClassNames}`}
                  onClick={() => column.sortable && handleSort(column.uid)}
                  style={{ cursor: column.sortable ? 'pointer' : 'default' }}
                >
                  <div className="flex items-center gap-1">
                    {column.name}
                    {column.sortable && sortDescriptor.column === column.uid && (
                      <>
                        {sortDescriptor.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={heroUITableClasses.tbody()}>
            {sortedItems.map((item) => (
              <tr
                draggable
                className={`${heroUITableClasses.tr()} cursor-pointer`}
                key={item.id}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ opacity: dragCount ? 0.5 : 1 }}
              >
                <td className={`${heroUITableClasses.td()} ${tdClassNames}`}>
                  <Checkbox isSelected={isSelected(item.id)} onChange={() => handleSelectRow(item.id)} />
                </td>
                {headerColumns.map((column) => (
                  <td key={column.uid} className={`${heroUITableClasses.td()} ${tdClassNames}`}>
                    {renderCell(item, column.uid)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedItems.length === 0 && (
        <div className="flex justify-center items-center w-full h-48 text-neutral-500">
          <div>No test case</div>
        </div>
      )}

      {dragCount !== null && (
        <Card
          className="absolute"
          style={{
            left: mousePos.x,
            top: mousePos.y,
            pointerEvents: 'none',
          }}
        >
          <CardBody>
            <p>{dragCount} cases selected</p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
