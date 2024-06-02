'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { MemberType, UserType } from '@/types/user';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import MembersTable from './MembersTable';
import AddMemberDialog from './AddMemberDialog';
import { fetchProjectMembers, addMember, deleteMember, updateMember } from './membersControl';

type Props = {
  projectId: string;
  messages: SettingsMessages;
  locale: string;
};

export default function SettingsPage({ projectId, messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchProjectMembers(context.token.access_token, projectId);
        setMembers(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  const handleAddMember = async (userAdded: UserType) => {
    const newMember = await addMember(context.token.access_token, userAdded.id, projectId);
    newMember.User = userAdded;
    const updateMembers = [...members];
    updateMembers.push(newMember);
    setMembers(updateMembers);

    setIsDialogOpen(false);
  };

  const handleDeleteMember = async (userDeleted: UserType) => {
    await deleteMember(context.token.access_token, userDeleted.id, projectId);
    setMembers(members.filter((member) => member.User.id !== userDeleted.id));
  };

  const handleChangeRole = async (userEdit: UserType, role: number) => {
    await updateMember(context.token.access_token, userEdit.id, projectId, role);
    setMembers((prevMembers) => {
      return prevMembers.map((member) => {
        if (member.User.id === userEdit.id) {
          return { ...member, role: role };
        }
        return member;
      });
    });
  };

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.memberManagement}</h3>
        <Button
          startContent={<Plus size={16} />}
          size="sm"
          color="primary"
          isDisabled={!context.isProjectManager(Number(projectId))}
          onClick={() => setIsDialogOpen(true)}
        >
          {messages.addMember}
        </Button>
      </div>

      <MembersTable
        members={members}
        isDisabled={!context.isProjectManager(Number(projectId))}
        onChangeRole={handleChangeRole}
        onDeleteMember={handleDeleteMember}
        messages={messages}
      />

      <AddMemberDialog
        isOpen={isDialogOpen}
        projectId={projectId}
        onCancel={() => setIsDialogOpen(false)}
        onAddMember={handleAddMember}
        messages={messages}
      />
    </div>
  );
}
