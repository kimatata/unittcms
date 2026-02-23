'use client';
import { useState, useContext, useRef } from 'react';
import { Button, Input, Card, CardHeader, CardBody, addToast, CardFooter, Select, SelectItem } from '@heroui/react';
import { Globe } from 'lucide-react';
import { TokenContext } from '@/utils/TokenProvider';
import { updateUsername, updatePassword, uploadAvatar, deleteAvatar, updateLocale } from '@/utils/usersControl';
import { LocaleCodeType } from '@/types/locale';
import { logError } from '@/utils/errorHandler';
import UserAvatar from '@/components/UserAvatar';
import { useRouter, usePathname } from '@/src/i18n/routing';
import { locales } from '@/config/selection';
import { LocaleType } from '@/types/locale';

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
  changeLocale: string;
  updateLocale: string;
  localeUpdated: string;
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
  invalidLocale: string;
};

type Props = {
  messages: ProfileSettingsPageMessages;
  locale: LocaleCodeType;
};

export default function ProfileSettingsPage({ messages, locale: defaultLocale }: Props) {
  const context = useContext(TokenContext);

  const router = useRouter();
  const pathname = usePathname();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [locale, setLocale] = useState<LocaleCodeType>(context.token?.user?.locale ?? defaultLocale);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingLocale, setIsUpdatingLocale] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.usernameEmpty,
      });
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const result = await updateUsername(context.token.access_token, username);
      if (result && result.user) {
        // refresh username
        const newToken = { ...context.token };
        if (newToken.user) {
          newToken.user.username = result.user.username;
        }
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);

        addToast({
          title: 'Success',
          color: 'success',
          description: messages.usernameUpdated,
        });
        setUsername('');
      }
    } catch (error) {
      logError('Error updating username:', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.updateError,
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!currentPassword || !newPassword) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.updateError,
      });
      return;
    }

    if (newPassword.length < 8) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.invalidPassword,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.passwordNotMatch,
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(context.token.access_token, currentPassword, newPassword);
      addToast({
        title: 'Success',
        color: 'success',
        description: messages.passwordUpdated,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      logError('Error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : messages.updateError;
      if (errorMessage.includes('incorrect')) {
        addToast({
          title: 'Error',
          color: 'danger',
          description: messages.currentPasswordIncorrect,
        });
      } else {
        addToast({
          title: 'Error',
          color: 'danger',
          description: messages.updateError,
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLocaleUpdate = async () => {
    if (!locales.some((l) => l.code === locale)) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.invalidLocale,
      });
      return;
    }

    setIsUpdatingLocale(true);
    try {
      const result = await updateLocale(context.token.access_token, locale);
      if (result && result.user) {
        // refresh locale
        const newToken = { ...context.token };
        if (newToken.user) {
          newToken.user.locale = result.user.locale;
        }
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);

        addToast({
          title: 'Success',
          color: 'success',
          description: messages.localeUpdated,
        });
        const nextLocale = result.user.locale ?? locale;
        setLocale(nextLocale);
        changeLocale(nextLocale);
      }
    } catch (error) {
      logError('Error updating locale:', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.updateError,
      });
    } finally {
      setIsUpdatingLocale(false);
    }
  };

  async function changeLocale(nextLocale: LocaleCodeType) {
    router.push(pathname, { locale: nextLocale });
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.onlyImagesAllowed,
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: 'Warning',
        color: 'warning',
        description: messages.maxFileSize5mb,
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(context.token.access_token, file);
      if (result && result.user) {
        const newToken = { ...context.token };
        if (newToken.user) {
          newToken.user = result.user;
        }
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);
        addToast({
          title: 'Success',
          color: 'success',
          description: messages.avatarUpdated,
        });
      }
    } catch (error) {
      logError('Error uploading avatar:', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.updateError,
      });
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
        const newToken = { ...context.token };
        if (newToken.user) {
          newToken.user = result.user;
        }
        context.setToken(newToken);
        context.storeTokenToLocalStorage(newToken);
        addToast({
          title: 'Success',
          color: 'success',
          description: messages.avatarRemoved,
        });
      }
    } catch (error) {
      logError('Error removing avatar:', error);
      addToast({
        title: 'Error',
        color: 'danger',
        description: messages.updateError,
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!context.isSignedIn()) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-xl pt-6 px-6 flex-grow">
      <h1 className="text-2xl font-bold mb-6">{messages.profileSettings}</h1>

      {/* Change Username */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-large font-semibold">{messages.changeUsername}</h2>
        </CardHeader>
        <CardBody>
          <form>
            <div className="space-y-4">
              <Input
                size="sm"
                autoComplete="username"
                label={messages.newUsername}
                placeholder={context.token?.user?.username || ''}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            color="primary"
            onPress={handleUsernameUpdate}
            isLoading={isUpdatingUsername}
            isDisabled={!username.trim()}
            size="sm"
          >
            {messages.updateUsername}
          </Button>
        </CardFooter>
      </Card>

      {/* Change Password */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-large font-semibold">{messages.changePassword}</h2>
        </CardHeader>
        <CardBody>
          <form>
            <div className="space-y-4">
              {/* hidden username field for accessibility */}
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={context.token?.user?.username || ''}
                style={{ display: 'none' }}
                tabIndex={-1}
                readOnly
              />
              <Input
                size="sm"
                type="password"
                autoComplete="current-password"
                label={messages.currentPassword}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                size="sm"
                type="password"
                autoComplete="new-password"
                label={messages.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                size="sm"
                type="password"
                autoComplete="new-password"
                label={messages.confirmNewPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            size="sm"
            color="primary"
            onPress={handlePasswordUpdate}
            isLoading={isUpdatingPassword}
            isDisabled={!currentPassword || !newPassword || !confirmPassword}
          >
            {messages.updatePassword}
          </Button>
        </CardFooter>
      </Card>

      {/* Change Locale */}
      <Card className="mb-6">
        <CardHeader>
          <Globe size={16} />
          <h2 className="text-large font-semibold ml-2">{messages.changeLocale}</h2>
        </CardHeader>
        <CardBody>
          <form>
            <div className="space-y-4">
              <Select<LocaleType>
                fullWidth
                aria-label="change locale"
                selectedKeys={[locale]}
                disabledKeys={[locale]}
                onSelectionChange={(value) => {
                  const selectedLocale = locales.find((locale) => locale.code === value.currentKey);
                  if (!selectedLocale) return;
                  setLocale(selectedLocale.code);
                }}
              >
                {locales.map((locale) => (
                  <SelectItem key={locale.code}>{locale.name}</SelectItem>
                ))}
              </Select>
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end">
          <Button
            color="primary"
            onPress={handleLocaleUpdate}
            isLoading={isUpdatingLocale}
            isDisabled={locale === context.token?.user?.locale}
            size="sm"
          >
            {messages.updateLocale}
          </Button>
        </CardFooter>
      </Card>

      {/* Change Avatar */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-large font-semibold">{messages.changeAvatar}</h2>
        </CardHeader>
        <CardBody>
          <form>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar
                  size={96}
                  username={context.token?.user?.username}
                  avatarPath={context.token?.user?.avatarPath}
                />
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
              </div>
            </div>
          </form>
        </CardBody>
        <CardFooter className="flex justify-end">
          {context.token?.user?.avatarPath && (
            <Button
              size="sm"
              color="danger"
              className="me-2"
              onPress={handleAvatarRemove}
              isLoading={isUploadingAvatar}
            >
              {messages.removeAvatar}
            </Button>
          )}
          <Button size="sm" color="primary" onPress={() => fileInputRef.current?.click()} isLoading={isUploadingAvatar}>
            {messages.uploadAvatar}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
