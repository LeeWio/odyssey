"use client";

import type { AbstractIntlMessages } from "next-intl";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";
import { MediaProvider } from "@/features/media/context/media-provider";
import {
  AppIntlProvider,
  AppStoreProvider,
  AppThemeProvider,
  ToastProvider,
} from "@/components/providers";

export interface ProvidersProps {
  children: React.ReactNode;
  lang: string;
  messages: AbstractIntlMessages;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, lang, messages, themeProps }: ProvidersProps) {
  return (
    <AppIntlProvider lang={lang} messages={messages}>
      <AppStoreProvider>
        <AppThemeProvider {...themeProps}>
          <MediaProvider>{children}</MediaProvider>
          <ToastProvider />
        </AppThemeProvider>
      </AppStoreProvider>
    </AppIntlProvider>
  );
}
