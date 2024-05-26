'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { UserType, AdminMessages } from '@/types/user';
import { TokenContext } from '../TokenProvider';
import UsersTable from './UsersTable';
import Config from '@/config/config';
const apiServer = Config.apiServer;

type Props = {
  messages: AdminMessages;
  locale: string;
};

async function fetchUsers(jwt: string) {
  const fetchOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  };

  const url = `${apiServer}/users`;

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

export default function AdminPage({ messages, locale }: Props) {
  const context = useContext(TokenContext);
  const [users, setUsers] = useState<UserType[]>([]);

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isSignedIn()) {
        return;
      }

      try {
        const data = await fetchUsers(context.token.access_token);
        setUsers(data);
      } catch (error: any) {
        console.error('Error in effect:', error.message);
      }
    }

    fetchDataEffect();
  }, [context]);

  return (
    <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
      <div className="w-full p-3 flex items-center justify-between">
        <h3 className="font-bold">{messages.userManagement}</h3>
      </div>

      <UsersTable users={users} messages={messages} locale={locale} />
    </div>
  );
}
