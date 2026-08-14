import { ExplorerPage } from "@/features/explorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Explorer | Odyssey",
  description:
    "Browse Odyssey's actual codebase structure. Inspect specific directories and files to understand its architectural layers.",
};

export default function ExplorerRoute() {
  return <ExplorerPage />;
}
