"use client";

import * as React from "react";
import { I18nProvider } from "@heroui/react";
import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore } from "@/lib/store";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { selectThemeVariant, setThemeVariant } from "@/lib/features/ui";
import {
  coerceResolvedThemeMode,
  coerceThemeMode,
  coerceThemeVariant,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_VARIANT,
  getThemeName,
  LEGACY_THEME_STORAGE_KEY,
  parseThemeName,
  resolveThemeMode,
  THEME_COOKIE_OPTIONS,
  THEME_MODE_STORAGE_KEY,
  THEME_NAME_STORAGE_KEY,
  THEME_RESOLVED_MODE_STORAGE_KEY,
  THEME_VARIANT_STORAGE_KEY,
  type ResolvedThemeMode,
  type ThemeMode,
  type ThemeVariant,
} from "@/lib/theme";

// next-themes renders an inline <script> to prevent theme flicker on SSR.
// React 19 strictly warns about script tags inside components during client-side render.
// This warning is a false-positive — the script runs correctly during SSR.
if (process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Encountered a script tag while rendering React component") ||
        args[0].includes("Scripts inside React components are never executed"))
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

function writeThemeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${THEME_COOKIE_OPTIONS}`;
}

function persistThemeState(
  variant: ThemeVariant,
  mode: ThemeMode,
  resolvedMode: ResolvedThemeMode,
  themeName: string
) {
  try {
    localStorage.setItem(THEME_VARIANT_STORAGE_KEY, variant);
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, variant);
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    localStorage.setItem(THEME_RESOLVED_MODE_STORAGE_KEY, resolvedMode);
    localStorage.setItem(THEME_NAME_STORAGE_KEY, themeName);
  } catch {}

  try {
    writeThemeCookie(THEME_VARIANT_STORAGE_KEY, variant);
    writeThemeCookie(LEGACY_THEME_STORAGE_KEY, variant);
    writeThemeCookie(THEME_MODE_STORAGE_KEY, mode);
    writeThemeCookie(THEME_RESOLVED_MODE_STORAGE_KEY, resolvedMode);
    writeThemeCookie(THEME_NAME_STORAGE_KEY, themeName);
  } catch {}
}

function ThemeRootSync() {
  const dispatch = useAppDispatch();
  const variant = useAppSelector(selectThemeVariant) ?? DEFAULT_THEME_VARIANT;
  const { resolvedTheme, setTheme, theme } = useTheme();

  React.useEffect(() => {
    if (!theme) return;

    const parsedTheme = parseThemeName(theme);

    if (parsedTheme) {
      dispatch(setThemeVariant(parsedTheme.variant));
      setTheme(parsedTheme.resolvedMode);
      return;
    }

    const mode = coerceThemeMode(theme);
    const safeVariant = coerceThemeVariant(variant);
    const resolvedMode = resolveThemeMode(mode, coerceResolvedThemeMode(resolvedTheme));
    const themeName = getThemeName(safeVariant, resolvedMode);
    const root = document.documentElement;

    root.dataset.theme = themeName;
    root.dataset.themeVariant = safeVariant;
    root.dataset.themeMode = mode;
    root.dataset.themeResolvedMode = resolvedMode;
    root.classList.toggle("dark", resolvedMode === "dark");
    root.classList.toggle("light", resolvedMode === "light");
    root.style.colorScheme = resolvedMode;

    persistThemeState(safeVariant, mode, resolvedMode, themeName);
  }, [dispatch, resolvedTheme, setTheme, theme, variant]);

  return null;
}

export interface ProvidersProps {
  children: React.ReactNode;
  lang: string;
  messages: AbstractIntlMessages;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, lang, messages, themeProps }: ProvidersProps) {
  const [store] = React.useState(() => makeStore());

  React.useEffect(() => {
    return setupListeners(store.dispatch);
  }, [store]);

  return (
    <I18nProvider locale={lang}>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="UTC">
        <ReduxProvider store={store}>
          <NextThemesProvider
            attribute="class"
            defaultTheme={DEFAULT_THEME_MODE}
            disableTransitionOnChange
            enableSystem
            storageKey={THEME_MODE_STORAGE_KEY}
            {...themeProps}
          >
            <ThemeRootSync />
            {children}
          </NextThemesProvider>
        </ReduxProvider>
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
