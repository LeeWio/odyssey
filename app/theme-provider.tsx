"use client";

import type { ThemeProviderProps } from "next-themes";

import { selectThemeVariant } from "@/lib/features/theme/theme-slice";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useAppSelector } from "@/lib/hooks";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function ThemeProvider({ children, themeProps }: ProvidersProps) {
  const themeVariant = useAppSelector(selectThemeVariant);
  const themeValueMap = {
    light: themeVariant === "default" ? "light" : `${themeVariant}-light`,
    dark: themeVariant === "default" ? "dark" : `${themeVariant}-dark`,
  };

  return (
    <NextThemesProvider {...themeProps} value={themeValueMap}>
      {children}
    </NextThemesProvider>
  );
}
