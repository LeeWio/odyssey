import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PulseHeartTestClient from "./pulse-heart-test-client";

export const metadata: Metadata = {
  title: "Pulse Heart",
  robots: { index: false, follow: false },
};

export default function PulseHeartTestPage() {
  if (process.env.NODE_ENV !== "development" && process.env.ENABLE_PULSE_HEART_TEST_ROUTE !== "1") {
    notFound();
  }

  return <PulseHeartTestClient />;
}
