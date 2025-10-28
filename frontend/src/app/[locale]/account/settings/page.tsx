import { useTranslations } from 'next-intl';
import ProfileSettingsPage from './ProfileSettingsPage';
import { PageType } from '@/types/base';
import { LocaleCodeType } from '@/types/locale';

export default function Page({ params }: PageType) {
  const t = useTranslations('Auth');
  const messages = {
    profileSettings: t('profile_settings'),
    changeUsername: t('change_username'),
    newUsername: t('new_username'),
    updateUsername: t('update_username'),
    usernameUpdated: t('username_updated'),
    changePassword: t('change_password'),
    currentPassword: t('current_password'),
    newPassword: t('new_password'),
    confirmNewPassword: t('confirm_new_password'),
    updatePassword: t('update_password'),
    passwordUpdated: t('password_updated'),
    changeAvatar: t('change_avatar'),
    uploadAvatar: t('upload_avatar'),
    removeAvatar: t('remove_avatar'),
    avatarUpdated: t('avatar_updated'),
    avatarRemoved: t('avatar_removed'),
    maxFileSize5mb: t('max_file_size_5mb'),
    onlyImagesAllowed: t('only_images_allowed'),
    currentPasswordIncorrect: t('current_password_incorrect'),
    updateError: t('update_error'),
    invalidPassword: t('invalid_password'),
    passwordNotMatch: t('password_not_match'),
    usernameEmpty: t('username_empty'),
  };

  return <ProfileSettingsPage messages={messages} locale={params.locale as LocaleCodeType} />;
}
