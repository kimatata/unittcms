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
  SortDescriptor,
} from '@heroui/react';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { MoreVertical } from 'lucide-react';
import { RunsMessages, RunType } from '@/types/run';
import dayjs from 'dayjs';
import { LocaleCodeType } from '@/types/locale';

type Props = {
  projectId: string;
  isDisabled: boolean;
  runs: RunType[];
  onDeleteRun: (runId: number) => void;
  messages: RunsMessages;
  locale: LocaleCodeType;
};

export default function RunsTable({ projectId, isDisabled, runs, onDeleteRun, messages, locale }: Props) {
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);
  useEffect(() => {
    if (isDisabled) {
      setDisabledKeys(['delete']);
    } else {
      setDisabledKeys([]);
    }
  }, [isDisabled]);

  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.name, uid: 'name', sortable: true },
    { name: messages.lastUpdate, uid: 'updatedAt', sortable: true },
    { name: messages.actions, uid: 'actions' },
  ];

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...runs].sort((a: RunType, b: RunType) => {
      const first = a[sortDescriptor.column as keyof RunType] as number;
      const second = b[sortDescriptor.column as keyof RunType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, runs]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const renderCell = (run: RunType, columnKey: string) => {
    const cellValue = run[columnKey as keyof RunType];

    switch (columnKey) {
      case 'id':
        return <span>{cellValue as number}</span>;
      case 'name':
        const maxLength = 30;
        const truncatedDescription = truncateText(run.description, maxLength);
        return (
          <div>
            <Link href={`/projects/${projectId}/runs/${run.id}`} locale={locale} className={NextUiLinkClasses}>
              {cellValue as string}
            </Link>
            <div className="text-xs text-default-500">
              <div>{truncatedDescription}</div>
            </div>
          </div>
        );
      case 'updatedAt':
        return <span>{dayjs(cellValue as string).format('YYYY/MM/DD HH:mm')}</span>;
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly radius="full" size="sm" variant="light">
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="run actions" disabledKeys={disabledKeys}>
              <DropdownItem className="text-danger" key="delete" onPress={() => onDeleteRun(run.id)}>
                {messages.deleteRun}
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
      <Table
        isCompact
        aria-label="Runs table"
        classNames={classNames}
        sortDescriptor={sortDescriptor}
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
        <TableBody emptyContent={messages.noRunsFound} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey as string) as ReactNode}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}
