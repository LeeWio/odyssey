"use client";

import * as React from "react";
import { I18nProvider } from "@heroui/react";
import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Provider as ReduxProvider } from "react-redux";
import { makeStore } from "@/lib/store";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

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

function BaseThemeApplier() {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    // Self-heal legacy compound theme names (like 'mouve-dark') in localStorage to standard 'dark'/'light'.
    // This aligns with next-themes provider themes list and ensures the ModeSwitch segment highlight functions perfectly.
    if (theme && theme.includes("-")) {
      const mode = theme.endsWith("dark") ? "dark" : "light";
      setTheme(mode);
      return;
    }

    if (!theme) return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, [theme, setTheme]);

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
            attribute="data-theme"
            defaultTheme="dark"
            value={{
              light: "mouve-light",
              dark: "mouve-dark",
            }}
            {...themeProps}
          >
            <BaseThemeApplier />
            {children}
          </NextThemesProvider>
        </ReduxProvider>
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
