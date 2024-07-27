import { User } from 'lucide-react';
import Avatar from 'boring-avatars';
import { TokenContextType } from '@/types/user';

type Props = {
  context: TokenContextType;
};

export default function PublicityChip({ context }: Props) {
  return context.isSignedIn() ? (
    <Avatar
      size={16}
      name={context.token!.user!.username}
      variant="beam"
      colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
    />
  ) : (
    <User size={16} />
  );
}
