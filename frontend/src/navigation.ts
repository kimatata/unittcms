import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const locales = ["en", "ja"] as const;
export const localePrefix = "always";

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales, localePrefix });

export const NextUiLinkClasses =
  "data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-medium text-primary hover:underline hover:opacity-80 active:opacity-disabled transition-opacity underline-offset-4 dark:text-white";
