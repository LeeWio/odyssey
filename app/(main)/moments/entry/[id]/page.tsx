import { notFound } from "next/navigation";

import { MomentDetailPage } from "@/features/moment/views/moment-detail-page";
import { getPublicMoment } from "@/lib/features/moment/server";

export default async function MomentEntryRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const momentId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(momentId) || momentId < 1) notFound();
  const result = await getPublicMoment(momentId);
  if (result.status === 404) notFound();
  if (!result.data) throw new Error("Moment request failed");
  return <MomentDetailPage moment={result.data} />;
}
