"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";

import TokenProvider from "./TokenProvider";
import { TokenProps } from "@/types/user";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  userProps?: TokenProps;
}

export function Providers({ children, themeProps, userProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <TokenProvider {...userProps}>{children}</TokenProvider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
