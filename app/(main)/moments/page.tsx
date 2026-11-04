import { getPublicMomentsInitialData } from "@/lib/features/moment/public-moments";
import { parsePageParam } from "@/lib/utils/pagination";

import MomentsPageClient from "./moments-page-client";

export default async function MomentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; topic?: string | string[] }>;
}) {
  const params = await searchParams;
  const page = parsePageParam((Array.isArray(params.page) ? params.page[0] : params.page) ?? null);
  const topic = (Array.isArray(params.topic) ? params.topic[0] : params.topic) || undefined;
  const initialData = await getPublicMomentsInitialData(12, page, topic);
  return <MomentsPageClient initialData={initialData} />;
}
