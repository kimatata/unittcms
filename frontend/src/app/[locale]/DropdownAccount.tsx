'use client';
import { Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { User, ChevronDown, PenTool, ArrowRightFromLine, ArrowRightToLine } from 'lucide-react';
import { useContext } from 'react';
import { TokenContext } from './TokenProvider';
import { useRouter } from '@/src/navigation';
import { AccountDropDownMessages } from '@/types/user';

type Props = {
  messages: AccountDropDownMessages;
  locale: string;
};

export default function DropdownAccount({ messages, locale }: Props) {
  const router = useRouter();
  const context = useContext(TokenContext);

  const signOut = () => {
    context.setToken(null);
    context.removeTokenFromLocalStorage();
    router.push(`/`, { locale: locale });
  };

  const signinItems = [
    {
      uid: 'account',
      title: messages.account,
      icon: <User size={16} />,
      onPress: () => {
        router.push('/account', { locale: locale });
      },
    },
    {
      uid: 'signout',
      title: messages.signOut,
      icon: <ArrowRightFromLine size={16} />,
      onPress: signOut,
    },
  ];

  const signoutItems = [
    {
      uid: 'signin',
      title: messages.signIn,
      icon: <ArrowRightToLine size={16} />,
      onPress: () => {
        router.push('/account/signin', { locale: locale });
      },
    },
    {
      uid: 'signup',
      title: messages.signUp,
      icon: <PenTool size={16} />,
      onPress: () => {
        router.push('/account/signup', { locale: locale });
      },
    },
  ];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button size="sm" variant="light" startContent={<User size={16} />} endContent={<ChevronDown size={16} />}>
          {context.token && context.token.user ? context.token.user.username : messages.signIn}
        </Button>
      </DropdownTrigger>
      {context.token && context.token.user ? (
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
