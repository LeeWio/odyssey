import { GalleryPage } from "@/features/gallery";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Gallery");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function GalleryRoute() {
  return <GalleryPage />;
}
