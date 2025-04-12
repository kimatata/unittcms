'use client';
import { useState, useContext } from 'react';
import { TokenContext } from '@/utils/TokenProvider';
import { Link, useRouter } from '@/src/i18n/routing';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Navbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  Link as NextUiLink,
  Chip,
  ListboxItem,
  Listbox,
} from '@heroui/react';
import { ArrowRightFromLine, ArrowRightToLine, File, Globe, MoveUpRight, PenTool } from 'lucide-react';
import { ThemeSwitch } from '@/components/ThemeSwitch';
import { GithubIcon } from '@/components/icons';
import { locales } from '@/config/selection';
import DropdownAccount from './DropdownAccount';
import DropdownLanguage from './DropdownLanguage';
import UserAvatar from '@/components/UserAvatar';
import { LocaleCodeType } from '@/types/locale';

type NabbarMenuMessages = {
  projects: string;
  admin: string;
  docs: string;
  roadmap: string;
  account: string;
  signUp: string;
  signIn: string;
  signOut: string;
  links: string;
  languages: string;
};

type Props = {
  messages: NabbarMenuMessages;
  locale: LocaleCodeType;
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
      href: 'https://kimatata.github.io/unittcms/docs/getstarted/selfhost',
      label: messages.docs,
      isExternal: true,
    },
    {
      uid: 'roadmap',
      href: 'https://kimatata.github.io/unittcms/docs/roadmap/',
      label: messages.roadmap,
      isExternal: true,
    },
  ];

  const router = useRouter();
  const pathname = usePathname();
  async function changeLocale(nextLocale: string) {
    let newPathname;
    if (pathname.length < 4) {
      // when root path
      router.push('/', { locale: nextLocale });
    } else {
      // when not root path, trim first "/en" from pathname = "/en/projects"
      newPathname = pathname.slice(locale.length + 1);
      router.push(newPathname, { locale: nextLocale });
    }
  }

  return (
    <Navbar isMenuOpen={isMenuOpen} maxWidth="full" position="sticky" className="bg-inherit">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link className="flex justify-start items-center gap-1" href="/" locale={locale}>
            <Image src="/favicon/icon-192.png" width={32} height={32} alt="Logo" />
            <p className="font-bold text-inherit ms-1">UnitTCMS</p>
          </Link>
        </NavbarBrand>
        <NavbarItem className="hidden md:block">
          <Chip size="sm" variant="flat">
            <Link className="data-[active=true]:text-primary data-[active=true]:font-medium" href="/" locale={locale}>
              1.0.0-beta.10
            </Link>
          </Chip>
        </NavbarItem>
        {commonLinks.map((link) =>
          link.isExternal ? (
            <NavbarItem key={link.uid} className="hidden md:block">
              <NextUiLink
                isExternal
                href={link.href}
                showAnchorIcon
                anchorIcon={<MoveUpRight size={12} className="ms-1" />}
              >
                {link.label}
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
        <NextUiLink isExternal href="https://github.com/kimatata/unittcms" aria-label="Github">
          <GithubIcon className="text-default-500" />
        </NextUiLink>
        <ThemeSwitch />
        <div className="hidden md:block">
          <DropdownAccount messages={messages} locale={locale} onItemPress={() => {}} />
          <DropdownLanguage locale={locale} onChangeLocale={changeLocale} />
        </div>
        <NavbarMenuToggle className="md:hidden" onChange={() => setIsMenuOpen(!isMenuOpen)} />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <p className="font-bold">{messages.links}</p>
          <Listbox
            aria-label="Links"
            itemClasses={{
              base: 'h-10 text-large',
            }}
          >
            {commonLinks.map((link) =>
              link.isExternal ? (
                <ListboxItem
                  key={link.uid}
                  title={link.label}
                  startContent={<MoveUpRight size={12} />}
                  onPress={() => {
                    window.open(link.href, '_blank');
                    setIsMenuOpen(false);
                  }}
                />
              ) : (
                <ListboxItem
                  key={link.uid}
                  title={link.label}
                  startContent={<File size={12} />}
                  onPress={() => {
                    router.push(link.href, { locale: locale });
                    setIsMenuOpen(false);
                  }}
                />
              )
            )}
          </Listbox>

          <p className="font-bold">{messages.account}</p>
          {context.isSignedIn() ? (
            <Listbox
              aria-label="Account links"
              itemClasses={{
                base: 'h-10 text-large',
              }}
            >
              <ListboxItem
                key="account"
                title={messages.account}
                startContent={<UserAvatar context={context} />}
                onPress={() => {
                  router.push('/account', { locale: locale });
                  setIsMenuOpen(false);
                }}
              />
              <ListboxItem
                key="signout"
                title={messages.signOut}
                startContent={<ArrowRightFromLine size={16} />}
                onPress={() => {
                  context.setToken({
                    access_token: '',
                    expires_at: 0,
                    user: null,
                  });
                  context.removeTokenFromLocalStorage();
                  router.push(`/account/signin`, { locale: locale });
                  setIsMenuOpen(false);
                }}
              />
            </Listbox>
          ) : (
            <Listbox
              aria-label="Account links"
              itemClasses={{
                base: 'h-10 text-large',
              }}
            >
              <ListboxItem
                key="signin"
                startContent={<ArrowRightToLine size={16} />}
                title={messages.signIn}
                onPress={() => {
                  router.push('/account/signin', { locale: locale });
                  setIsMenuOpen(false);
                }}
              />
              <ListboxItem
                key="signup"
                title={messages.signUp}
                startContent={<PenTool size={16} />}
                onPress={() => {
                  router.push('/account/signup', { locale: locale });
                  setIsMenuOpen(false);
                }}
              />
            </Listbox>
          )}
          <p className="font-bold">{messages.languages}</p>
          <Listbox
            aria-label="Language links"
            itemClasses={{
              base: 'h-10 text-large',
            }}
          >
            {locales.map((entry) => (
              <ListboxItem
                key={entry.code}
                startContent={<Globe size={16} />}
                title={entry.name}
                onPress={() => {
                  changeLocale(entry.code);
                  setIsMenuOpen(false);
                }}
              />
            ))}
          </Listbox>
        </div>
      </NavbarMenu>
    </Navbar>
  );
}
