import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getPublicLifeListInitialData } from "@/lib/features/life-list/public-life-list";

import { LifeListPageClient } from "./life-list-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("LifeList");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function LifeListPage() {
  const initial = await getPublicLifeListInitialData();
  return <LifeListPageClient initialPage={initial.page} initialCategories={initial.categories} />;
}
