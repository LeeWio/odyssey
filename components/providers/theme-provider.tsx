"use client";

import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";
import {
  applyThemeToElement,
  DEFAULT_THEME_MODE,
  getStoredThemeVariant,
  isResolvedThemeMode,
  isThemeMode,
  persistThemeMode,
  THEME_MODE_STORAGE_KEY,
} from "@/lib/theme";

function ThemeRootSync() {
  const { resolvedTheme, theme } = useTheme();

  React.useEffect(() => {
    if (!isResolvedThemeMode(resolvedTheme)) return;

    applyThemeToElement(document.documentElement, getStoredThemeVariant(), resolvedTheme);
    if (isThemeMode(theme)) persistThemeMode(theme);
  }, [resolvedTheme, theme]);

  return null;
}

export interface AppThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function AppThemeProvider({ children, ...themeProps }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_MODE}
      enableSystem
      storageKey={THEME_MODE_STORAGE_KEY}
      {...themeProps}
    >
      <ThemeRootSync />
      {children}
    </NextThemesProvider>
  );
}
