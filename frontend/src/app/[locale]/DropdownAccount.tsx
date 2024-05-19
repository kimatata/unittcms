"use client";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { User, ChevronDown } from "lucide-react";
import { useContext } from "react";
import { TokenContext } from "./TokenProvider";
import { Link } from "@/src/navigation";

type Props = {
  locale: string;
};

const signinItems = [
  { uid: "account", title: "Account", href: "/account" },
  { uid: "signout", title: "Sign out", href: "/account/signout" },
];

const signoutItems = [
  { uid: "signin", title: "Sign in", href: "/account/signin" },
];

export default function LangSwitch({ locale }: Props) {
  const context = useContext(TokenContext);
  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          size="sm"
          variant="faded"
          startContent={<User size={16} />}
          endContent={<ChevronDown size={16} />}
        >
          {context.token ? context.token.user.username : "SignIn"}
        </Button>
      </DropdownTrigger>
      {context.token ? (
        <DropdownMenu aria-label="account actions when sign in">
          {signinItems.map((entry) => (
            <DropdownItem key={entry.uid}>
              <Link href={entry.href} locale={locale}>
                {entry.title}
              </Link>
            </DropdownItem>
          ))}
        </DropdownMenu>
      ) : (
        <DropdownMenu aria-label="account actions when sign out">
          {signoutItems.map((entry) => (
            <DropdownItem key={entry.uid}>
              <Link href={entry.href} locale={locale}>
                {entry.title}
              </Link>
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </Dropdown>
  );
}
