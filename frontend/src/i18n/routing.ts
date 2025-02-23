import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ja'],
  defaultLocale: 'en',
  localePrefix: {
    mode: 'always',
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

export const NextUiLinkClasses =
  'data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 text-medium text-primary hover:underline hover:opacity-80 active:opacity-disabled transition-opacity underline-offset-4 dark:text-white';
