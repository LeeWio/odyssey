"use client";

import { useLocale, type AbstractIntlMessages } from "next-intl";
import { Suspense, use, type ReactNode } from "react";
import { ScopedMessages } from "@/components/providers/scoped-messages";

const catalogs = new Map<string, Promise<AbstractIntlMessages>>();
const readyCatalogs = new Map<string, AbstractIntlMessages>();

export function preloadDashboardMessages(locale: string) {
  const cached = catalogs.get(locale);
  if (cached) return cached;
  const pending = (
    locale === "zh"
      ? import("@/messages/dashboard/zh.json")
      : import("@/messages/dashboard/en.json")
  ).then((module) => {
    readyCatalogs.set(locale, module.default);
    return module.default;
  });
  catalogs.set(locale, pending);
  return pending;
}

function DashboardMessageScope({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const messages = readyCatalogs.get(locale) ?? use(preloadDashboardMessages(locale));
  return <ScopedMessages messages={messages}>{children}</ScopedMessages>;
}

export function DashboardMessages({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <DashboardMessageScope>{children}</DashboardMessageScope>
    </Suspense>
  );
}
