import type { Metadata } from "next";

import { FootprintsPage } from "@/features/footprints";

export const metadata: Metadata = {
  title: "Footprints | Odyssey",
  description: "A personal atlas of places, years, and memories that stayed on the road.",
};

export default function FootprintsRoute() {
  return <FootprintsPage />;
}
