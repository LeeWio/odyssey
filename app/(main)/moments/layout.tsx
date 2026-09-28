import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");

  return {
    title: t("metaMomentsTitle"),
    description: t("metaMomentsDescription"),
  };
}

export default function MomentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="relative z-10 min-h-screen w-full">{children}</div>;
}
