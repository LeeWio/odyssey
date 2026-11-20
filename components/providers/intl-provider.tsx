"use client";

import { I18nProvider } from "@heroui/react";
import { type AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import type * as React from "react";

export interface AppIntlProviderProps {
  children: React.ReactNode;
  lang: string;
  messages: AbstractIntlMessages;
}

export function AppIntlProvider({ children, lang, messages }: AppIntlProviderProps) {
  return (
    <I18nProvider locale={lang}>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
