import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");

  return {
    title: t("metaAboutTitle"),
    description: t("metaAboutDescription"),
  };
}

export default function AboutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="relative z-10 min-h-screen w-full">{children}</div>;
}
