'use client';

import * as React from 'react';
import { HeroUIProvider } from '@heroui/react';
import { ToastProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from 'next-themes';
import TokenProvider from '@/utils/TokenProvider';
import { TokenProps } from '@/types/user';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  tokenProps?: TokenProps;
}

export function Providers({ children, themeProps, tokenProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <ToastProvider />
        <TokenProvider {...tokenProps}>{children}</TokenProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
