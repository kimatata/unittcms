import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  Link as NextUiLink,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/config/site";
import { Link } from "@/src/navigation";
import LangSwitch from "./LangSwitch";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon } from "@/components/icons";

import Image from "next/image";

export default function Header(params: { locale: string }) {
  const t = useTranslations("Index");

  return (
    <NextUINavbar maxWidth="xl" position="sticky" className="bg-inherit">
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
            <p className="font-bold text-inherit">Test Case Manager</p>
          </Link>
        </NavbarBrand>
        {siteConfig.navItems.map((item) => (
          <NavbarItem key={item.href}>
            <Link
              className="data-[active=true]:text-primary data-[active=true]:font-medium"
              href={item.href}
              locale={params.locale}
            >
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent className="basis-1 pl-4" justify="end">
        <NextUiLink
          isExternal
          href="https://github.com/kimatata/TestCaseManager"
          aria-label="Github"
        >
          <GithubIcon className="text-default-500" />
        </NextUiLink>
        <ThemeSwitch />
        <LangSwitch locale={params.locale} />
      </NavbarContent>
    </NextUINavbar>
  );
}
