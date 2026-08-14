import { GalleryPage } from "@/features/gallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analog Photography Gallery | Odyssey",
  description:
    "Browse modular landscapes, geometric intersections, and cold coastal weather patterns framed on medium-format analog film.",
};

export default function GalleryRoute() {
  return <GalleryPage />;
}
