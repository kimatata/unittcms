import { useState, useMemo, useCallback, ReactNode } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, SortDescriptor } from '@heroui/react';
import { Link, NextUiLinkClasses } from '@/src/i18n/routing';
import { ProjectType, ProjectsMessages } from '@/types/project';
import dayjs from 'dayjs';
import PublicityChip from '@/components/PublicityChip';
import { LocaleCodeType } from '@/types/locale';

type Props = {
  projects: ProjectType[];
  messages: ProjectsMessages;
  locale: LocaleCodeType;
};

export default function ProjectsTable({ projects, messages, locale }: Props) {
  const headerColumns = [
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.publicity, uid: 'isPublic', sortable: true },
    { name: messages.name, uid: 'name', sortable: true },
    { name: messages.lastUpdate, uid: 'updatedAt', sortable: true },
  ];

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...projects].sort((a: ProjectType, b: ProjectType) => {
      const first = a[sortDescriptor.column as keyof ProjectType] as number;
      const second = b[sortDescriptor.column as keyof ProjectType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, projects]);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  };

  const renderCell = useCallback((project: ProjectType, columnKey: string): ReactNode => {
    const cellValue = project[columnKey as keyof ProjectType];

    switch (columnKey) {
      case 'id':
        return <span>{cellValue as number}</span>;
      case 'isPublic':
        return (
          <PublicityChip isPublic={cellValue as boolean} publicText={messages.public} privateText={messages.private} />
        );
      case 'name':
        const maxLength = 30;
        const truncatedDetail = truncateText(project.detail, maxLength);
        return (
          <div>
            <Link href={`/projects/${project.id}/home`} locale={locale} className={NextUiLinkClasses}>
              {cellValue as string}
            </Link>
            <div className="text-xs text-default-500">
              <div>{truncatedDetail}</div>
            </div>
          </div>
        );
      case 'updatedAt':
        return <span>{dayjs(cellValue as number).format('YYYY/MM/DD HH:mm')}</span>;
      default:
        return cellValue as string;
    }
  }, []);

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
        aria-label="Projects table"
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
        <TableBody emptyContent={messages.noProjectsFound} items={sortedItems}>
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
