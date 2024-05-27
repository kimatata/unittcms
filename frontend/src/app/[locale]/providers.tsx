'use client';

import * as React from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import ToastProvider from '@/utils/ToastProvider';
import { ToastProps } from '@/types/toast';
import TokenProvider from '@/utils/TokenProvider';
import { TokenProps } from '@/types/user';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  toastProps?: ToastProps;
  tokenProps?: TokenProps;
}

export function Providers({ children, themeProps, toastProps, tokenProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <ToastProvider {...toastProps}>
          <TokenProvider {...tokenProps}>{children}</TokenProvider>
        </ToastProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
