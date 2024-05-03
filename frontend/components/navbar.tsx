import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  Kbd,
  Link as NextUiLink,
  Input,
} from "@nextui-org/react";
import { Link } from "@/src/navigation";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon, SearchIcon } from "@/components/icons";

import Image from "next/image";

export const Navbar = () => {
  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
    <NextUINavbar maxWidth="xl" position="sticky" className="bg-inherit">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <Link className="flex justify-start items-center gap-1" href="/">
            <Image
              src="/favicon/android-chrome-192x192.png"
              width={32}
              height={32}
              alt="Logo"
            />
            <p className="font-bold text-inherit">Test Case Manager</p>
          </Link>
        </NavbarBrand>
        <ul className="hidden lg:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className="data-[active=true]:text-primary data-[active=true]:font-medium"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <NextUiLink
            isExternal
            href={siteConfig.links.github}
            aria-label="Github"
          >
            <GithubIcon className="text-default-500" />
          </NextUiLink>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <NextUiLink
          isExternal
          href={siteConfig.links.github}
          aria-label="Github"
        >
          <GithubIcon className="text-default-500" />
        </NextUiLink>
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>
    </NextUINavbar>
  );
};
