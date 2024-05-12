import {
  Navbar as NextUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  Chip,
  Link as NextUiLink,
} from "@nextui-org/react";
import { MoveUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/navigation";
import LangSwitch from "./LangSwitch";
import { ThemeSwitch } from "@/components/theme-switch";
import { GithubIcon } from "@/components/icons";
import Image from "next/image";

export default function Header(params: { locale: string }) {
  const t = useTranslations("Header");

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
        <NavbarItem className="hidden sm:block">
          <Chip size="sm" variant="flat">
            <Link
              className="data-[active=true]:text-primary data-[active=true]:font-medium"
              href="/about"
              locale={params.locale}
            >
              1.0.0-alpha.3
            </Link>
          </Chip>
        </NavbarItem>
        <NavbarItem className="hidden sm:block">
          <Link
            className="data-[active=true]:text-primary data-[active=true]:font-medium"
            href="/projects"
            locale={params.locale}
          >
            {t("projects")}
          </Link>
        </NavbarItem>
        <NavbarItem className="hidden sm:block">
          <NextUiLink
            isExternal
            href="https://kimatata.github.io/TestPlat/docs/selfhost"
            aria-label="docs"
            showAnchorIcon
            anchorIcon={<MoveUpRight size={12} className="ms-1" />}
          >
            {t("docs")}
          </NextUiLink>
        </NavbarItem>
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
        <LangSwitch locale={params.locale} />
      </NavbarContent>
    </NextUINavbar>
  );
}
