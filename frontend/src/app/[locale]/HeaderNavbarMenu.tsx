'use client';
import { useState, useContext } from 'react';
import { TokenContext } from '@/utils/TokenProvider';
import { Link } from '@/src/navigation';
import Image from 'next/image';
import {
  Navbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Link as NextUiLink,
  Chip,
} from '@nextui-org/react';
import { MoveUpRight } from 'lucide-react';
import { ThemeSwitch } from '@/components/theme-switch';
import { GithubIcon } from '@/components/icons';
import DropdownAccount from './DropdownAccount';
import DropdownLanguage from './DropdownLanguage';

type NabbarMenuMessages = {
  projects: string;
  admin: string;
  docs: string;
  account: string;
  signUp: string;
  signIn: string;
  signOut: string;
};

type Props = {
  messages: NabbarMenuMessages;
  locale: string;
};

export default function HeaderNavbarMenu({ messages, locale }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const context = useContext(TokenContext);

  const commonLinks = [
    {
      uid: 'projects',
      href: '/projects',
      label: messages.projects,
      isExternal: false,
    },
    {
      uid: 'docs',
      href: 'https://kimatata.github.io/landtcms/docs/getstarted/selfhost',
      label: messages.docs,
      isExternal: true,
    },
  ];

  return (
    <Navbar isMenuOpen={isMenuOpen} maxWidth="full" position="sticky" className="bg-inherit">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link className="flex justify-start items-center gap-1" href="/" locale={locale}>
            <Image src="/favicon/android-chrome-192x192.png" width={32} height={32} alt="Logo" />
            <p className="font-bold text-inherit">LandTCMS</p>
          </Link>
        </NavbarBrand>
        <NavbarItem className="hidden md:block">
          <Chip size="sm" variant="flat">
            <Link className="data-[active=true]:text-primary data-[active=true]:font-medium" href="/" locale={locale}>
              1.0.0-alpha.8
            </Link>
          </Chip>
        </NavbarItem>
        {commonLinks.map((link) =>
          link.isExternal ? (
            <NavbarItem key={link.uid} className="hidden md:block">
              <NextUiLink
                isExternal
                href="https://kimatata.github.io/landtcms/docs/getstarted/selfhost"
                aria-label="docs"
                showAnchorIcon
                anchorIcon={<MoveUpRight size={12} className="ms-1" />}
              >
                {messages.docs}
              </NextUiLink>
            </NavbarItem>
          ) : (
            <NavbarItem key={link.uid} className="hidden md:block">
              <Link
                className="data-[active=true]:text-primary data-[active=true]:font-medium"
                href={link.href}
                locale={locale}
              >
                {link.label}
              </Link>
            </NavbarItem>
          )
        )}
        {context.isAdmin() && (
          <NavbarItem key="admin" className="hidden md:block">
            <Link
              className="data-[active=true]:text-primary data-[active=true]:font-medium"
              href="/admin"
              locale={locale}
            >
              {messages.admin}
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent className="basis-1 pl-4" justify="end">
        <NextUiLink isExternal href="https://github.com/kimatata/landtcms" aria-label="Github">
          <GithubIcon className="text-default-500" />
        </NextUiLink>
        <ThemeSwitch />
        <div className="hidden md:block">
          <DropdownAccount messages={messages} locale={locale} onItemPress={() => {}} />
          <DropdownLanguage locale={locale} />
        </div>
        <NavbarMenuToggle className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <DropdownAccount messages={messages} locale={locale} onItemPress={() => setIsMenuOpen(false)} />
          </NavbarMenuItem>
          <NavbarMenuItem>
            <DropdownLanguage locale={locale} />
          </NavbarMenuItem>
          {commonLinks.map((link) =>
            link.isExternal ? (
              <NavbarMenuItem key={link.uid}>
                <NextUiLink
                  href={link.href}
                  onPress={() => setIsMenuOpen(false)}
                  showAnchorIcon
                  anchorIcon={<MoveUpRight size={12} className="ms-1" />}
                >
                  {messages.docs}
                </NextUiLink>
              </NavbarMenuItem>
            ) : (
              <NavbarMenuItem key={link.uid}>
                <Link
                  className="data-[active=true]:text-primary data-[active=true]:font-medium"
                  href={link.href}
                  locale={locale}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </NavbarMenuItem>
            )
          )}
        </div>
      </NavbarMenu>
    </Navbar>
  );
}
