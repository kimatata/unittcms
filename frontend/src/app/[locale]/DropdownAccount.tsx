'use client';
import { Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem } from '@heroui/react';
import { ChevronDown, PenTool, ArrowRightFromLine, ArrowRightToLine } from 'lucide-react';
import { useContext } from 'react';
import { TokenContext } from '@/utils/TokenProvider';
import { useRouter } from '@/src/i18n/routing';
import { AccountDropDownMessages } from '@/types/user';
import UserAvatar from '@/components/UserAvatar';

type Props = {
  messages: AccountDropDownMessages;
  locale: string;
  onItemPress: () => void;
};

export default function DropdownAccount({ messages, locale, onItemPress }: Props) {
  const router = useRouter();
  const context = useContext(TokenContext);

  const signOut = () => {
    context.setToken({
      access_token: '',
      expires_at: 0,
      user: null,
    });
    context.removeTokenFromLocalStorage();
    router.push(`/account/signin`, { locale: locale });
  };

  const signinItems = [
    {
      uid: 'account',
      title: messages.account,
      icon: <UserAvatar context={context} />,
      onPress: () => {
        router.push('/account', { locale: locale });
        onItemPress();
      },
    },
    {
      uid: 'signout',
      title: messages.signOut,
      icon: <ArrowRightFromLine size={16} />,
      onPress: () => {
        signOut();
        onItemPress();
      },
    },
  ];

  const signoutItems = [
    {
      uid: 'signin',
      title: messages.signIn,
      icon: <ArrowRightToLine size={16} />,
      onPress: () => {
        router.push('/account/signin', { locale: locale });
        onItemPress();
      },
    },
    {
      uid: 'signup',
      title: messages.signUp,
      icon: <PenTool size={16} />,
      onPress: () => {
        router.push('/account/signup', { locale: locale });
        onItemPress();
      },
    },
  ];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="light"
          startContent={<UserAvatar context={context} />}
          endContent={<ChevronDown size={16} />}
        >
          {context.isSignedIn() ? context.token!.user!.username : messages.signIn}
        </Button>
      </DropdownTrigger>
      {context.isSignedIn() ? (
        <DropdownMenu aria-label="account actions when sign in">
          {signinItems.map((entry) => (
            <DropdownItem key={entry.uid} title={entry.title} startContent={entry.icon} onPress={entry.onPress} />
          ))}
        </DropdownMenu>
      ) : (
        <DropdownMenu aria-label="account actions when sign out">
          {signoutItems.map((entry) => (
            <DropdownItem key={entry.uid} title={entry.title} startContent={entry.icon} onPress={entry.onPress} />
          ))}
        </DropdownMenu>
      )}
    </Dropdown>
  );
}
