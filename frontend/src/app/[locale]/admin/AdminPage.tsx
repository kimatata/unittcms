'use client';
import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { UserType, AdminMessages } from '@/types/user';
import { TokenContext } from '@/utils/TokenProvider';
import { useRouter } from '@/src/navigation';
import UsersTable from './UsersTable';
import Config from '@/config/config';
import { LocaleCodeType } from '@/types/locale';
import { updateUserRole } from '@/utils/usersControl';
import { Button, Divider } from '@nextui-org/react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
const apiServer = Config.apiServer;

type Props = {
  messages: AdminMessages;
  locale: LocaleCodeType;
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
  const router = useRouter();
  const context = useContext(TokenContext);
  const [users, setUsers] = useState<UserType[]>([]);

  // Quit confirm dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!context.isAdmin()) {
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

  const handleChangeRole = async (userEdit: UserType, role: number) => {
    if (!context.isAdmin()) {
      console.log('you are not admin', context);
      return;
    }

    if (userEdit.id) {
      const data = await updateUserRole(context.token.access_token, userEdit.id, role);
      console.log(data);
      setUsers((prevUsers) => {
        return prevUsers.map((user) => {
          if (user.id === userEdit.id) {
            return { ...user, role: role };
          }
          return user;
        });
      });
    }
  };

  const onQuitConfirm = async () => {
    const data = await updateUserRole(context.token.access_token, userEdit.id, role);
    router.push(`/`, { locale: locale });
  };

  return (
    <>
      <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
        <div className="w-full p-3 flex items-center justify-between">
          <h3 className="font-bold">{messages.userManagement}</h3>
        </div>

        <UsersTable users={users} onChangeRole={handleChangeRole} messages={messages} />

        <Divider className="my-8" />
        <div>
          <Button color="danger" variant="bordered" onPress={() => setIsConfirmDialogOpen(true)}>
            {messages.quitAdmin}
          </Button>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={isConfirmDialogOpen}
        onCancel={closeConfirmDialog}
        onConfirm={onQuitConfirm}
        closeText={messages.close}
        confirmText={messages.quitConfirm}
        deleteText={messages.quit}
      />
    </>
  );
}
