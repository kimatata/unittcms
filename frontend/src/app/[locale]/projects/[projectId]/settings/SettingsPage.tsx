'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { UserType } from '@/types/user';
import { SettingsMessages } from '@/types/settings';
import { TokenContext } from '@/utils/TokenProvider';
import MembersTable from './MembersTable';
import Config from '@/config/config';
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
    console.log(data);
    return data;
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
  }
}

// User Search by username
async function fetchUsers(jwt: string, text: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/users?text=${text}`;

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
  const [members, setMembers] = useState<UserType[]>([]);

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

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.memberManagement}</h3>
      </div>

      <MembersTable members={members} messages={messages} locale={locale} />
    </div>
  );
}
