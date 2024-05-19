"use client";
import { useContext } from "react";
import { Avatar, Card, CardHeader, CardBody, Divider } from "@nextui-org/react";
import { TokenContext } from "../TokenProvider";

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
      {context.token && context.token.user && (
        <Card className="w-[600px] mt-16 mx-3">
          <CardHeader className="flex gap-6">
            <Avatar
              isBordered
              radius="full"
              className="w-16 h-16 text-large"
              src={context.token.user.avatarPath}
            />
            <div className="flex flex-col">
              <p className="text-2xl font-bold">
                {context.token.user.username}
              </p>
              <p className="text-lg text-default-500">
                {context.token.user.email}
              </p>
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
