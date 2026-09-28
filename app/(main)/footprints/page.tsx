import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { FootprintsPage } from "@/features/footprints";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");

  return {
    title: t("metaFootprintsTitle"),
    description: t("metaFootprintsDescription"),
  };
}

export default function FootprintsRoute() {
  return <FootprintsPage />;
}
