import { GalleryPage } from "@/features/gallery";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Blog");

  return {
    title: t("metaGalleryTitle"),
    description: t("metaGalleryDescription"),
  };
}

export default function GalleryRoute() {
  return <GalleryPage />;
}
