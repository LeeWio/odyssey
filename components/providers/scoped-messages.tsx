"use client";

import {
  NextIntlClientProvider,
  useLocale,
  useMessages,
  type AbstractIntlMessages,
} from "next-intl";
import { useMemo, type ReactNode } from "react";

export function ScopedMessages({
  messages,
  children,
}: {
  messages: AbstractIntlMessages;
  children: ReactNode;
}) {
  const parent = useMessages();
  const locale = useLocale();
  const merged = useMemo(() => ({ ...parent, ...messages }), [parent, messages]);
  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}
