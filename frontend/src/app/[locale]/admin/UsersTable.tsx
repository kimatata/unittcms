import { useState, useMemo } from 'react';
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import { UserType, AdminMessages } from '@/types/user';
import { roles } from '@/config/selection';
import Avatar from 'boring-avatars';

type Props = {
  users: UserType[];
  myself: UserType | null;
  onChangeRole: (userEdit: UserType, role: number) => void;
  messages: AdminMessages;
};

export default function UsersTable({ users, myself, onChangeRole, messages }: Props) {
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

  const isMyself = (myself: UserType | null, user: UserType) => {
    if (myself && myself.id === user.id) {
      return true;
    } else {
      return false;
    }
  };

  const renderCell = (user: UserType, columnKey: string) => {
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
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                isDisabled={isMyself(myself, user)}
                variant="light"
                endContent={<ChevronDown size={16} />}
              >
                <span className="w-20">{messages[roles[cellValue as number].uid]}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="global role actions">
              {roles.map((role, index) => (
                <DropdownItem key={index} onPress={() => onChangeRole(user, index)}>
                  {messages[role.uid]}
                </DropdownItem>
              ))}
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
