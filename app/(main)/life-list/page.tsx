import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getPublicLifeListInitialData } from "@/lib/features/life-list/server";
import { LifeListPage } from "@/features/life-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LifeList");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function LifeListRoute() {
  const initial = await getPublicLifeListInitialData();
  return <LifeListPage initialPage={initial.page} initialCategories={initial.categories} />;
}
