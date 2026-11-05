"use client";

import { I18nProvider, Toast } from "@heroui/react";
import { setupListeners } from "@reduxjs/toolkit/query";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import * as React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { getServerState, makeStore } from "@/lib/store";
import { MediaProvider } from "@/features/media/context/media-provider";
import {
  applyThemeToElement,
  DEFAULT_THEME_MODE,
  getStoredThemeVariant,
  isResolvedThemeMode,
  isThemeMode,
  persistThemeMode,
  THEME_MODE_STORAGE_KEY,
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
        args[0].includes("Scripts inside React components are never executed") ||
        args[0].includes("params are being enumerated") ||
        args[0].includes("The keys of searchParams were accessed directly") ||
        args[0].includes("sync-dynamic-apis"))
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

function ThemeRootSync() {
  const { resolvedTheme, theme } = useTheme();

  React.useEffect(() => {
    if (!isResolvedThemeMode(resolvedTheme)) return;

    applyThemeToElement(document.documentElement, getStoredThemeVariant(), resolvedTheme);
    if (isThemeMode(theme)) persistThemeMode(theme);
  }, [resolvedTheme, theme]);

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
  const [serverState] = React.useState(getServerState);

  React.useEffect(() => {
    return setupListeners(store.dispatch);
  }, [store]);

  return (
    <I18nProvider locale={lang}>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="UTC">
        <ReduxProvider store={store} serverState={serverState}>
          <NextThemesProvider
            attribute="class"
            defaultTheme={DEFAULT_THEME_MODE}
            enableSystem
            storageKey={THEME_MODE_STORAGE_KEY}
            {...themeProps}
          >
            <ThemeRootSync />
            <MediaProvider>{children}</MediaProvider>
            <Toast.Provider maxVisibleToasts={4} placement="bottom end" />
          </NextThemesProvider>
        </ReduxProvider>
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
