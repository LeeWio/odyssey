"use client";

import { ReactNode } from "react";
import { I18nProvider } from "@heroui/react";
import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";

interface IntlProviderProps {
  lang: string;
  children: ReactNode;
  messages: AbstractIntlMessages;
}

export function IntlProvider({ lang, children, messages }: IntlProviderProps) {
  return (
    <I18nProvider locale={lang}>
      <NextIntlClientProvider locale={lang} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
