import { SchedulePage } from "@/features/schedule";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule & Focus | Odyssey",
  description:
    "Schedule blocks, plan daily focus, and coordinate visual engineering timelines dynamically.",
};

export default function ScheduleRoute() {
  return <SchedulePage />;
}
