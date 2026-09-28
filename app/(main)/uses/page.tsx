import { UsesPage } from "@/features/uses";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");

  return {
    title: t("metaUsesTitle"),
    description: t("metaUsesDescription"),
  };
}

export default function UsesRoute() {
  return <UsesPage />;
}
