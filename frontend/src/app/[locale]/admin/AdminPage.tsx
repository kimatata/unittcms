'use client';
import { useState, useEffect, useContext } from 'react';
import { Button, addToast } from '@heroui/react';
import UsersTable from './UsersTable';
import PasswordResetDialog from './PasswordResetDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { UserType, AdminMessages } from '@/types/user';
import { TokenContext } from '@/utils/TokenProvider';
import { useRouter } from '@/src/i18n/routing';
import Config from '@/config/config';
import { LocaleCodeType } from '@/types/locale';
import { updateUserRole, adminResetPassword } from '@/utils/usersControl';
import { roles } from '@/config/selection';
import { logError } from '@/utils/errorHandler';
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
  } catch (error: unknown) {
    logError('Error fetching data:', error);
  }
}

export default function AdminPage({ messages, locale }: Props) {
  const router = useRouter();
  const tokenContext = useContext(TokenContext);
  const [users, setUsers] = useState<UserType[]>([]);
  const [myself, setMyself] = useState<UserType | null>(null);

  // Quit confirm dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };

  useEffect(() => {
    async function fetchDataEffect() {
      if (!tokenContext.isAdmin()) {
        return;
      }

      try {
        const data = await fetchUsers(tokenContext.token.access_token);
        setUsers(data);

        if (tokenContext.token.user) {
          setMyself(tokenContext.token.user);
        }
      } catch (error: unknown) {
        logError('Error fetching users:', error);
      }
    }

    fetchDataEffect();
  }, [tokenContext]);

  const handleChangeRole = async (userEdit: UserType, role: number) => {
    if (!tokenContext.isAdmin()) {
      console.error('you are not admin');
      return;
    }

    if (userEdit.id) {
      const data = await updateUserRole(tokenContext.token.access_token, userEdit.id, role);
      if (data.user) {
        addToast({
          title: 'Success',
          color: 'success',
          description: messages.roleChanged,
        });
        setUsers((prevUsers) => {
          return prevUsers.map((user) => {
            if (user.id === userEdit.id) {
              return { ...user, role: role };
            }
            return user;
          });
        });
      }
    }
  };

  const onQuitConfirm = async () => {
    if (myself && myself.id) {
      const userRoleIndex = roles.findIndex((entry) => entry.uid === 'user');
      const data = await updateUserRole(tokenContext.token.access_token, myself.id, userRoleIndex);

      if (data && data.user) {
        addToast({
          title: 'Success',
          color: 'success',
          description: messages.lostAdminAuth,
        });
        router.push(`/`, { locale: locale });
      } else {
        setIsConfirmDialogOpen(false);
        addToast({
          title: 'Error',
          color: 'danger',
          description: messages.atLeast,
        });
      }
    }
  };

  // Reset password dialog state
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserType | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  const openResetDialog = (user: UserType) => {
    setResetTarget(user);
    setConfirmPassword('');
    setIsResetDialogOpen(true);
  };

  const onReset = async (newPassword: string) => {
    if (!tokenContext.isAdmin()) {
      console.error('you are not admin');
      return;
    }
    if (!resetTarget || !resetTarget.id) return;
    if (newPassword.length < 8) {
      addToast({ title: 'Warning', color: 'warning', description: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ title: 'Warning', color: 'warning', description: 'Password does not match' });
      return;
    }

    try {
      await adminResetPassword(tokenContext.token.access_token, resetTarget.id, newPassword);
      addToast({ title: 'Success', color: 'success', description: 'Password updated' });
      setIsResetDialogOpen(false);
      setResetTarget(null);
    } catch (error: unknown) {
      logError('Failed to reset password', error);
    }
  };

  return (
    <>
      <div className="container mx-auto max-w-3xl pt-16 px-6 flex-grow">
        <div className="w-full p-3 flex items-center justify-between">
          <h3 className="font-bold">{messages.userManagement}</h3>
        </div>

        <UsersTable
          users={users}
          myself={myself}
          onChangeRole={handleChangeRole}
          openResetDialog={openResetDialog}
          messages={messages}
        />
        <Button className="mt-4" color="danger" variant="bordered" onPress={() => setIsConfirmDialogOpen(true)}>
          {messages.quitAdmin}
        </Button>
      </div>

      <DeleteConfirmDialog
        isOpen={isConfirmDialogOpen}
        onCancel={closeConfirmDialog}
        onConfirm={onQuitConfirm}
        closeText={messages.close}
        confirmText={messages.quitConfirm}
        deleteText={messages.quit}
      />

      <PasswordResetDialog
        isOpen={isResetDialogOpen}
        onCancel={() => setIsResetDialogOpen(false)}
        onReset={onReset}
        messages={messages}
      />
    </>
  );
}
