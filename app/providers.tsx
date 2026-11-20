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
