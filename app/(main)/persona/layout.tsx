import type { ReactNode } from "react";
import { HomeMessages } from "@/features/home/home-messages";

export default function PersonaLayout({ children }: { children: ReactNode }) {
  return <HomeMessages>{children}</HomeMessages>;
}
