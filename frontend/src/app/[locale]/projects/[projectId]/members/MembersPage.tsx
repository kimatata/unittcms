'use client';
import { useState, useEffect, useContext } from 'react';
import { addToast, Button } from '@heroui/react';
import { Plus, UserPlus } from 'lucide-react';
import MembersTable from './MembersTable';
import AddMemberDialog from './AddMemberDialog';
import InviteDialog from './InviteDialog';
import { fetchProjectMembers, addMember, deleteMember, updateMember } from './membersControl';
import { MemberType, UserType } from '@/types/user';
import { MembersMessages } from '@/types/member';
import { InvitationMessages } from '@/types/invitation';
import { TokenContext } from '@/utils/TokenProvider';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { logError } from '@/utils/errorHandler';

type Props = {
  projectId: string;
  locale: string;
  messages: MembersMessages;
  invitationMessages: InvitationMessages;
};

export default function MembersPage({ projectId, locale, messages, invitationMessages }: Props) {
  const context = useContext(TokenContext);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProjectMembers(context.token.access_token, projectId);
        setMembers(data);
      } catch (error: unknown) {
        logError('Error fetching members:', error);
      }
    }

    fetchDataEffect();
  }, [context, projectId]);

  const handleAddMember = async (userAdded: UserType) => {
    if (userAdded.id) {
      const newMember = await addMember(context.token.access_token, userAdded.id, Number(projectId));
      newMember.User = userAdded;
      const updateMembers = [...members];
      updateMembers.push(newMember);
      setMembers(updateMembers);
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.memberAdded,
      });
    }

    setIsDialogOpen(false);
  };

  // delete confirm dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deleteMemberId, setDeleteMemberId] = useState<number | null>(null);
  const closeDeleteConfirmDialog = () => {
    setIsDeleteConfirmDialogOpen(false);
    setDeleteMemberId(null);
  };

  const onDeleteClick = (memberId: number) => {
    setDeleteMemberId(memberId);
    setIsDeleteConfirmDialogOpen(true);
  };

  const onConfirm = async () => {
    if (deleteMemberId) {
      await deleteMember(context.token.access_token, deleteMemberId, Number(projectId));
      setMembers(members.filter((member) => member.User.id !== deleteMemberId));
      closeDeleteConfirmDialog();
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.memberDeleted,
      });
    }
  };

  const handleChangeRole = async (userEdit: UserType, role: number) => {
    if (userEdit.id) {
      await updateMember(context.token.access_token, userEdit.id, Number(projectId), role);
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.roleChanged,
      });
      setMembers((prevMembers) => {
        return prevMembers.map((member) => {
          if (member.User.id === userEdit.id) {
            return { ...member, role: role };
          }
          return member;
        });
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <div className="w-full p-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold">{messages.memberManagement}</h3>
        <div className="flex items-center gap-2">
          <Button
            startContent={<UserPlus size={16} />}
            size="sm"
            variant="bordered"
            isDisabled={!context.isProjectManager(Number(projectId))}
            onPress={() => setIsInviteDialogOpen(true)}
          >
            {invitationMessages.invite}
          </Button>
          <Button
            startContent={<Plus size={16} />}
            size="sm"
            color="primary"
            isDisabled={!context.isProjectManager(Number(projectId))}
            onPress={() => setIsDialogOpen(true)}
          >
            {messages.addMember}
          </Button>
        </div>
      </div>

      <MembersTable
        members={members}
        isDisabled={!context.isProjectManager(Number(projectId))}
        onChangeRole={handleChangeRole}
        onDeleteMember={onDeleteClick}
        messages={messages}
      />

      <AddMemberDialog
        isOpen={isDialogOpen}
        projectId={projectId}
        onCancel={() => setIsDialogOpen(false)}
        onAddMember={handleAddMember}
        messages={messages}
      />

      <InviteDialog
        isOpen={isInviteDialogOpen}
        projectId={projectId}
        locale={locale}
        messages={invitationMessages}
        onCancel={() => setIsInviteDialogOpen(false)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmDialogOpen}
        onCancel={closeDeleteConfirmDialog}
        onConfirm={onConfirm}
        closeText={messages.close}
        confirmText={messages.areYouSure}
        deleteText={messages.delete}
      />
    </div>
  );
}
