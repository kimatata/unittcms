'use client';
import { Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { User, ChevronDown, PenTool, ArrowRightFromLine, ArrowRightToLine } from 'lucide-react';
import { useContext } from 'react';
import { TokenContext } from './TokenProvider';
import { useRouter } from '@/src/navigation';
import { AccountDropDownMessages } from '@/types/user';
import Avatar from 'boring-avatars';

type Props = {
  messages: AccountDropDownMessages;
  locale: string;
  onItemPress: () => void;
};

export default function DropdownAccount({ messages, locale, onItemPress }: Props) {
  const router = useRouter();
  const context = useContext(TokenContext);

  const signOut = () => {
    context.setToken(null);
    context.removeTokenFromLocalStorage();
    router.push(`/`, { locale: locale });
  };

  let userAvatar =
    context.token && context.token.user ? (
      <Avatar
        size={16}
        name={context.token.user.username}
        variant="beam"
        colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
      />
    ) : (
      <User size={16} />
    );

  const signinItems = [
    {
      uid: 'account',
      title: messages.account,
      icon: userAvatar,
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
        <Button size="sm" variant="light" startContent={userAvatar} endContent={<ChevronDown size={16} />}>
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
