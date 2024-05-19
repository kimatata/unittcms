import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
  Chip,
  Link as NextUiLink,
} from "@nextui-org/react";
import { MoveUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/navigation";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon } from "@/components/icons";
import Image from "next/image";
import DropdownAccount from "./DropdownAccount";
import DropdownLanguage from "./DropdownLanguage";

export default function Header(params: { locale: string }) {
  const t = useTranslations("Header");
  const messages = {
    account: t("account"),
    signUp: t("signup"),
    signIn: t("signin"),
    signOut: t("signout"),
  };

  // Links shown Header or slider
  const commonLinks = [
    {
      uid: "projects",
      href: "/projects",
      label: t("projects"),
      isExternal: false,
    },
    {
      uid: "docs",
      href: "https://kimatata.github.io/TestPlat/docs/getstarted/selfhost",
      label: t("docs"),
      isExternal: true,
    },
  ];

  return (
    <NextUINavbar maxWidth="full" position="sticky" className="bg-inherit">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link
            className="flex justify-start items-center gap-1"
            href="/"
            locale={params.locale}
          >
            <Image
              src="/favicon/android-chrome-192x192.png"
              width={32}
              height={32}
              alt="Logo"
            />
            <p className="font-bold text-inherit">TestPlat</p>
          </Link>
        </NavbarBrand>
        <NavbarItem className="hidden md:block">
          <Chip size="sm" variant="flat">
            <Link
              className="data-[active=true]:text-primary data-[active=true]:font-medium"
              href="/"
              locale={params.locale}
            >
              1.0.0-alpha.7
            </Link>
          </Chip>
        </NavbarItem>
        {commonLinks.map((link) =>
          link.isExternal ? (
            <NavbarItem key={link.uid} className="hidden md:block">
              <NextUiLink
                isExternal
                href="https://kimatata.github.io/TestPlat/docs/getstarted/selfhost"
                aria-label="docs"
                showAnchorIcon
                anchorIcon={<MoveUpRight size={12} className="ms-1" />}
              >
                {t("docs")}
              </NextUiLink>
            </NavbarItem>
          ) : (
            <NavbarItem key={link.uid} className="hidden md:block">
              <Link
                className="data-[active=true]:text-primary data-[active=true]:font-medium"
                href={link.href}
                locale={params.locale}
              >
                {link.label}
              </Link>
            </NavbarItem>
          )
        )}
      </NavbarContent>

      <NavbarContent className="basis-1 pl-4" justify="end">
        <NextUiLink
          isExternal
          href="https://github.com/kimatata/TestPlat"
          aria-label="Github"
        >
          <GithubIcon className="text-default-500" />
        </NextUiLink>
        <ThemeSwitch />
        <div className="hidden md:block">
          <DropdownAccount messages={messages} locale={params.locale} />
          <DropdownLanguage locale={params.locale} />
        </div>
        <NavbarMenuToggle className="md:hidden" />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          <NavbarMenuItem>
            <DropdownAccount messages={messages} locale={params.locale} />
          </NavbarMenuItem>
          <NavbarMenuItem>
            <DropdownLanguage locale={params.locale} />
          </NavbarMenuItem>
          {commonLinks.map((link) =>
            link.isExternal ? (
              <NavbarMenuItem key={link.uid}>
                <NextUiLink
                  href={link.href}
                  showAnchorIcon
                  anchorIcon={<MoveUpRight size={12} className="ms-1" />}
                >
                  {t("docs")}
                </NextUiLink>
              </NavbarMenuItem>
            ) : (
              <NavbarMenuItem key={link.uid}>
                <Link
                  className="data-[active=true]:text-primary data-[active=true]:font-medium"
                  href={link.href}
                  locale={params.locale}
                >
                  {link.label}
                </Link>
              </NavbarMenuItem>
            )
          )}
        </div>
      </NavbarMenu>
    </NextUINavbar>
  );
}
