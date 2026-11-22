import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MomentSubscriptionStatus } from "@/features/moment/views/moment-subscription-status";

export const metadata: Metadata = {
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function MomentSubscriptionRoute({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const { action } = await params;
  if (action !== "verify" && action !== "unsubscribe") notFound();
  return <MomentSubscriptionStatus action={action} />;
}
