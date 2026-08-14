import { ApiConsolePage } from "@/features/api-console";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Console & Playground | Odyssey",
  description:
    "Test Odyssey's core endpoint contracts. Edit query parameters, inspect popover schema definitions, and fetch live response payloads.",
};

export default function ApiConsoleRoute() {
  return <ApiConsolePage />;
}
