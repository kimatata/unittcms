import { useState, useMemo, ReactNode } from 'react';
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
import { MemberType, UserType } from '@/types/user';
import { memberRoles } from '@/config/selection';
import Avatar from 'boring-avatars';
import { MembersMessages } from '@/types/member';

type Props = {
  members: MemberType[];
  isDisabled: boolean;
  onChangeRole: (userEdit: UserType, role: number) => void;
  onDeleteMember: (deletedUserId: number) => void;
  messages: MembersMessages;
};

export default function MembersTable({ members, isDisabled, onChangeRole, onDeleteMember, messages }: Props) {
  const headerColumns = [
    { name: messages.avatar, uid: 'avatar' },
    { name: messages.email, uid: 'email', sortable: true },
    { name: messages.username, uid: 'username', sortable: true },
    { name: messages.role, uid: 'role', sortable: true },
    { name: messages.delete, uid: 'delete' },
  ];

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'role',
    direction: 'ascending',
  });

  const sortedItems = useMemo(() => {
    return [...members].sort((a: MemberType, b: MemberType) => {
      const first = a[sortDescriptor.column as keyof MemberType] as number;
      const second = b[sortDescriptor.column as keyof MemberType] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, members]);

  const renderCell = (member: MemberType, columnKey: string) => {
    const cellValue = member[columnKey as keyof MemberType];

    switch (columnKey) {
      case 'avatar':
        return (
          <Avatar
            size={24}
            name={member.User.username}
            variant="beam"
            colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
          />
        );
      case 'email':
        return member.User.email;
      case 'username':
        return member.User.username;
      case 'role':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button size="sm" isDisabled={isDisabled} variant="light" endContent={<ChevronDown size={16} />}>
                <span className="w-12">{messages[memberRoles[cellValue as number].uid]}</span>
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="test case actions">
              {memberRoles.map((role, index) => (
                <DropdownItem key={index} onPress={() => onChangeRole(member.User, index)}>
                  {messages[role.uid]}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        );
      case 'delete':
        return (
          <Button
            size="sm"
            isDisabled={isDisabled}
            color="danger"
            variant="light"
            onPress={() => {
              if (member.User.id) {
                onDeleteMember(member.User.id);
              }
            }}
          >
            {messages.deleteMember}
          </Button>
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
        <TableBody emptyContent={messages.noMembersFound} items={sortedItems}>
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
