"use client";

import type { ThemeProviderProps } from "next-themes";

import { selectThemeVariant } from "@/lib/features/theme/theme-slice";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useAppSelector } from "@/lib/hooks";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

// A helper component to safely inject the base "dark" class
// since next-themes cannot accept strings with spaces in its value map.
function BaseThemeApplier() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    if (!resolvedTheme) return;

    if (resolvedTheme.includes("dark")) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children, themeProps }: ProvidersProps) {
  const themeVariant = useAppSelector(selectThemeVariant);
  
  const themeValueMap = {
    light: themeVariant === "default" ? "light" : `${themeVariant}-light`,
    dark: themeVariant === "default" ? "dark" : `${themeVariant}-dark`,
  };

  return (
    <NextThemesProvider 
      attribute="data-theme" 
      defaultTheme="system" 
      {...themeProps} 
      value={themeValueMap}
    >
      <BaseThemeApplier />
      {children}
    </NextThemesProvider>
  );
}
