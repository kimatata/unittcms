import { useState, useMemo, useCallback } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, SortDescriptor } from '@nextui-org/react';
import { UserType, AdminMessages } from '@/types/user';
import { roles } from '@/config/selection';
import Avatar from 'boring-avatars';

type Props = {
  users: UserType[];
  messages: AdminMessages;
};

export default function UsersTable({ users, messages }: Props) {
  const headerColumns = [
    { name: messages.avatar, uid: 'avatar', sortable: false },
    { name: messages.id, uid: 'id', sortable: true },
    { name: messages.email, uid: 'email', sortable: true },
    { name: messages.username, uid: 'username', sortable: true },
    { name: messages.role, uid: 'role', sortable: true },
  ];

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...users].sort((a: UserType, b: UserType) => {
      const first = a[sortDescriptor.column as keyof UserType] as number;
      const second = b[sortDescriptor.column as keyof UserType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, users]);

  const renderCell = useCallback((user: UserType, columnKey: string) => {
    const cellValue = user[columnKey as keyof UserType];

    switch (columnKey) {
      case 'avatar':
        return (
          <Avatar
            size={24}
            name={user.username}
            variant="beam"
            colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
          />
        );
      case 'id':
        return <span>{cellValue}</span>;
      case 'email':
        return cellValue;
      case 'name':
        return cellValue;
      case 'role':
        return <span>{messages[roles[cellValue as number].uid]}</span>;

      default:
        return cellValue;
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
        aria-label="Users table"
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
        <TableBody emptyContent={messages.noUsersFound} items={sortedItems}>
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
