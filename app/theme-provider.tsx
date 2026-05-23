"use client";

import type { ThemeProviderProps } from "next-themes";

import { selectThemeVariant } from "@/lib/features/ui";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useAppSelector } from "@/lib/hooks";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

function BaseThemeApplier() {
  const { resolvedTheme } = useTheme();
  const themeVariant = useAppSelector(selectThemeVariant);

  React.useEffect(() => {
    if (!resolvedTheme) return;

    const colorMode = resolvedTheme.includes("dark") ? "dark" : "light";
    const themeName = themeVariant === "default" ? colorMode : `${themeVariant}-${colorMode}`;

    document.documentElement.setAttribute("data-theme", themeName);
    document.documentElement.classList.toggle("dark", colorMode === "dark");
    document.documentElement.classList.toggle("light", colorMode !== "dark");
  }, [resolvedTheme, themeVariant]);

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
