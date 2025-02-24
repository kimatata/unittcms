import { useMemo, useCallback } from 'react';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/react';
import { UserType } from '@/types/user';
import Avatar from 'boring-avatars';
import { MembersMessages } from '@/types/member';

type Props = {
  candidates: UserType[];
  onAddPress: (userAdded: UserType) => void;
  messages: MembersMessages;
};

export default function MembersTable({ candidates, onAddPress, messages }: Props) {
  const headerColumns = [
    { name: messages.avatar, uid: 'avatar', sortable: false },
    { name: messages.email, uid: 'email', sortable: false },
    { name: messages.username, uid: 'username', sortable: false },
    { name: messages.add, uid: 'add', sortable: false },
  ];

  const renderCell = useCallback((candidate: UserType, columnKey: string) => {
    const cellValue = candidate[columnKey as keyof UserType];

    switch (columnKey) {
      case 'avatar':
        return (
          <Avatar
            size={16}
            name={candidate.username}
            variant="beam"
            colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
          />
        );
      case 'email':
        return cellValue;
      case 'username':
        return cellValue;
      case 'add':
        return (
          <Button color="primary" variant="faded" size="sm" onPress={() => onAddPress(candidate)}>
            {messages.add}
          </Button>
        );
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
      <Table isCompact aria-label="Users table" classNames={classNames}>
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
        <TableBody emptyContent={messages.noMembersFound} items={candidates}>
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
