"use client";

import { I18nProvider } from "@heroui/react";
import { NextIntlClientProvider } from "next-intl";

export function IntlProvider({ lang, children, messages }) {
  return (
    <I18nProvider locale={lang}>
      <NextIntlClientProvider locale={lang} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </I18nProvider>
  );
}
