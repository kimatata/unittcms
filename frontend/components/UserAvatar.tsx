import { Avatar as HeroUiAvatar } from '@heroui/react';
import { User } from 'lucide-react';
import Avatar from 'boring-avatars';
import Config from '@/config/config';
const apiServer = Config.apiServer;

type Props = {
  size: number;
  username: string | undefined | null;
  avatarPath?: string | undefined | null;
};

export default function UserAvatar({ size, username, avatarPath }: Props) {
  if (username) {
    if (avatarPath) {
      return <HeroUiAvatar style={{ width: size, height: size }} src={`${apiServer}${avatarPath}`} />;
    } else {
      return (
        <Avatar
          size={size}
          name={username}
          variant="beam"
          colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
        />
      );
    }
  } else {
    return <User size={size} />;
  }
}
