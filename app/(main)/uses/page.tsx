import { UsesPage } from "@/features/uses";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uses | Odyssey",
  description: "The hardware, software, and tools I use on a daily basis.",
};

export default function UsesRoute() {
  return <UsesPage />;
}
