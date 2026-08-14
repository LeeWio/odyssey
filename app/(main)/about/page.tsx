import { AboutPage } from "@/features/about";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Odyssey",
  description:
    "Learn about the architectural vision, technical pillars, and design philosophy behind Odyssey.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
