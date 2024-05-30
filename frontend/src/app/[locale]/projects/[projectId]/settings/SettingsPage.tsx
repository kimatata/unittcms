'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { Button } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import { MemberType, UserType } from '@/types/user';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import MembersTable from './MembersTable';
import Config from '@/config/config';
import AddMemberDialog from './AddMemberDialog';
const apiServer = Config.apiServer;

type Props = {
  projectId: string;
  messages: SettingsMessages;
  locale: string;
};

// Member Search
async function fetchProjectMembers(jwt: string, projectId: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

async function addMember(jwt: string, userId: string, projectId: string) {
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/members?userId=${userId}&projectId=${projectId}`;

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

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

  const handleAddMember = async (memberAdded: UserType) => {
    const newMember = await addMember(context.token.access_token, memberAdded.id, projectId);
    newMember.User = memberAdded;
    const updateMembers = [...members];
    updateMembers.push(newMember);
    setMembers(updateMembers);

    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.memberManagement}</h3>
        <Button startContent={<Plus size={16} />} size="sm" color="primary" onClick={() => setIsDialogOpen(true)}>
          {messages.addMember}
        </Button>
      </div>

      <MembersTable members={members} messages={messages} />

      <AddMemberDialog
        isOpen={isDialogOpen}
        members={members}
        onCancel={() => setIsDialogOpen(false)}
        onAddMember={handleAddMember}
        messages={messages}
      />
    </div>
  );
}
