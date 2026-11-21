import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { ScopedMessages } from "@/components/providers/scoped-messages";

export async function HomeMessages({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages =
    locale === "zh"
      ? (await import("@/messages/home/zh.json")).default
      : (await import("@/messages/home/en.json")).default;

  return <ScopedMessages messages={messages}>{children}</ScopedMessages>;
}
