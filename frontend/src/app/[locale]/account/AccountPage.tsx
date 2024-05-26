'use client';
import { useContext } from 'react';
import { Card, CardHeader, CardBody, Divider } from '@nextui-org/react';
import { TokenContext } from '@/utils/TokenProvider';
import Avatar from 'boring-avatars';

type AccountPageMessages = {
  yourProjects: string;
};

type Props = {
  messages: AccountPageMessages;
  locale: string;
};

export default function AccountPage({ messages, locale }: Props) {
  const context = useContext(TokenContext);

  return (
    <>
      {context.isSignedIn() && (
        <Card className="w-[600px] mt-16 mx-3">
          <CardHeader className="flex gap-6">
            <Avatar
              size={48}
              name={context.token.user.username}
              variant="beam"
              colors={['#0A0310', '#49007E', '#FF005B', '#FF7D10', '#FFB238']}
            />
            <div className="flex flex-col">
              <p className="text-2xl font-bold">{context.token.user.username}</p>
              <p className="text-lg text-default-500">{context.token.user.email}</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="overflow-visible px-4 pb-4">
            <p className="text-default-500">{messages.yourProjects}</p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
