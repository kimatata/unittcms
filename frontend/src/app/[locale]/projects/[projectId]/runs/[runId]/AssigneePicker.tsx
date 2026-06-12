'use client';
import { useState, useMemo } from 'react';
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from '@heroui/react';
import { ChevronDown } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { MemberType } from '@/types/user';

type Props = {
  assigneeUserId: number | null | undefined;
  members: MemberType[];
  isDisabled: boolean;
  unassignedLabel: string;
  searchPlaceholder: string;
  triggerLabel?: string;
  onAssign: (userId: number | null) => void;
};

export default function AssigneePicker({
  assigneeUserId,
  members,
  isDisabled,
  unassignedLabel,
  searchPlaceholder,
  triggerLabel,
  onAssign,
}: Props) {
  const [search, setSearch] = useState('');

  const currentMember = useMemo(() => {
    if (!assigneeUserId) return null;
    return members.find((m) => m.User?.id === assigneeUserId) ?? null;
  }, [assigneeUserId, members]);

  const assigneeName = !assigneeUserId
    ? (triggerLabel ?? unassignedLabel)
    : (currentMember?.User?.username ?? unassignedLabel);

  const filteredMembers = useMemo(() => {
    if (!search) return members;
    return members.filter((m) => m.User?.username?.toLowerCase().includes(search.toLowerCase()));
  }, [search, members]);

  if (isDisabled) {
    return (
      <span className="text-sm text-default-500 flex items-center gap-1">
        <UserAvatar size={14} username={currentMember?.User?.username} avatarPath={currentMember?.User?.avatarPath} />
        {assigneeName}
      </span>
    );
  }

  return (
    <Dropdown
      onOpenChange={(open) => {
        if (!open) setSearch('');
      }}
    >
      <DropdownTrigger>
        <Button
          size="sm"
          variant="light"
          endContent={<ChevronDown size={14} />}
          startContent={
            <UserAvatar
              size={14}
              username={currentMember?.User?.username}
              avatarPath={currentMember?.User?.avatarPath}
            />
          }
        >
          <span className="max-w-24 truncate">{assigneeName}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Select assignee"
        onAction={(key) => onAssign(key === 'null' ? null : Number(key))}
        className="min-w-48"
        topContent={
          <div className="px-2 pt-2 pb-1">
            <Input
              size="sm"
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
        }
      >
        <>
          <DropdownItem key="null" textValue={unassignedLabel}>
            <span className="text-default-500">{unassignedLabel}</span>
          </DropdownItem>
          {filteredMembers.map((m) => (
            <DropdownItem key={String(m.User?.id)} textValue={m.User?.username}>
              {m.User?.username}
            </DropdownItem>
          ))}
        </>
      </DropdownMenu>
    </Dropdown>
  );
}
