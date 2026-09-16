import { TourPage } from "@/features/tour";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding Tour | Odyssey",
  description:
    "Take an interactive step-by-step tour through the Odyssey workspace. Understand how systems, design, and equipment connect.",
};

export default function TourRoute() {
  return <TourPage />;
}
