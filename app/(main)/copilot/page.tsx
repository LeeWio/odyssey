import { CopilotPage } from "@/features/copilot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Copilot | Odyssey",
  description:
    "Chat with the Odyssey AI Copilot to explore biography details, workstation gear, design systems, and low-level kernel architectures.",
};

export default function CopilotRoute() {
  return <CopilotPage />;
}
