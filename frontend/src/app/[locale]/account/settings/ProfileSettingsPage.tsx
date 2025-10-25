'use client';
import { useState, useContext, useRef } from 'react';
import { Button, Input, Card, CardHeader, CardBody, Divider } from '@heroui/react';
import Avatar from 'boring-avatars';
import { useToast } from '@/components/ToastProvider';
import { TokenContext } from '@/utils/TokenProvider';
import { updateUsername, updatePassword, uploadAvatar, deleteAvatar } from '@/utils/usersControl';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';
import Config from '@/config/config';

type ProfileSettingsPageMessages = {
  profileSettings: string;
  changeUsername: string;
  newUsername: string;
  updateUsername: string;
  usernameUpdated: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  updatePassword: string;
  passwordUpdated: string;
  changeAvatar: string;
  uploadAvatar: string;
  removeAvatar: string;
  avatarUpdated: string;
  avatarRemoved: string;
  maxFileSize5mb: string;
  onlyImagesAllowed: string;
  currentPasswordIncorrect: string;
  updateError: string;
  invalidPassword: string;
  passwordNotMatch: string;
  usernameEmpty: string;
};

type Props = {
  messages: ProfileSettingsPageMessages;
  locale: LocaleCodeType;
};

export default function ProfileSettingsPage({ messages }: Props) {
  const context = useContext(TokenContext);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const apiServer = Config.apiServer;

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      showToast(messages.usernameEmpty, 'warning');
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const result = await updateUsername(context.token.access_token, username);
      if (result && result.user) {
        // Update token context with new user data
        const newToken = {
          access_token: context.token.access_token,
          expires_at: Date.now() + 3600 * 1000 * 24,
          user: result.user,
        };
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);
        showToast(messages.usernameUpdated, 'success');
        setUsername('');
      }
    } catch (error) {
      logError('Error updating username:', error);
      showToast(messages.updateError, 'error');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      showToast(messages.updateError, 'warning');
      return;
    }

    if (newPassword.length < 8) {
      showToast(messages.invalidPassword, 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(messages.passwordNotMatch, 'warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(context.token.access_token, currentPassword, newPassword);
      showToast(messages.passwordUpdated, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      logError('Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : messages.updateError;
      if (errorMessage.includes('incorrect')) {
        showToast(messages.currentPasswordIncorrect, 'error');
      } else {
        showToast(messages.updateError, 'error');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast(messages.onlyImagesAllowed, 'warning');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast(messages.maxFileSize5mb, 'warning');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(context.token.access_token, file);
      if (result && result.user) {
        // Update token context with new user data
        const newToken = {
          access_token: context.token.access_token,
          expires_at: Date.now() + 3600 * 1000 * 24,
          user: result.user,
        };
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);
        showToast(messages.avatarUpdated, 'success');
      }
    } catch (error) {
      logError('Error uploading avatar:', error);
      showToast(messages.updateError, 'error');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarRemove = async () => {
    setIsUploadingAvatar(true);
    try {
      const result = await deleteAvatar(context.token.access_token);
      if (result && result.user) {
        // Update token context with new user data
        const newToken = {
          access_token: context.token.access_token,
          expires_at: Date.now() + 3600 * 1000 * 24,
          user: result.user,
        };
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);
        showToast(messages.avatarRemoved, 'success');
      }
    } catch (error) {
      logError('Error removing avatar:', error);
      showToast(messages.updateError, 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!context.isSignedIn()) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl pt-6 px-6 flex-grow">
      <h1 className="text-2xl font-bold mb-6">{messages.profileSettings}</h1>

      {/* Change Username */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{messages.changeUsername}</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-4">
            <Input
              label={messages.newUsername}
              placeholder={context.token?.user?.username || ''}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Button
              color="primary"
              onClick={handleUsernameUpdate}
              isLoading={isUpdatingUsername}
              isDisabled={!username.trim()}
            >
              {messages.updateUsername}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{messages.changePassword}</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-4">
            <Input
              type="password"
              label={messages.currentPassword}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              label={messages.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              label={messages.confirmNewPassword}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              color="primary"
              onClick={handlePasswordUpdate}
              isLoading={isUpdatingPassword}
              isDisabled={!currentPassword || !newPassword || !confirmPassword}
            >
              {messages.updatePassword}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Change Avatar */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-semibold">{messages.changeAvatar}</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {context.token?.user?.avatarPath ? (
                <img
                  src={`${apiServer}${context.token.user.avatarPath}`}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <Avatar
                  size={96}
                  name={context.token?.user?.username}
                  variant="beam"
                  colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
                />
              )}
              <div className="text-sm text-gray-500">{messages.maxFileSize5mb}</div>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                color="primary"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploadingAvatar}
              >
                {messages.uploadAvatar}
              </Button>
              {context.token?.user?.avatarPath && (
                <Button
                  color="danger"
                  variant="flat"
                  onClick={handleAvatarRemove}
                  isLoading={isUploadingAvatar}
                >
                  {messages.removeAvatar}
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
