import { RoadmapPage } from "@/features/roadmap";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap | Odyssey",
  description:
    "Explore the chronological milestones, shipped architectures, and future goals of the Odyssey personal ecosystem.",
};

export default function RoadmapRoute() {
  return <RoadmapPage />;
}
