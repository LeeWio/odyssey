import { getPublicMomentsInitialData } from "@/lib/features/moment/server";
import { parsePageParam } from "@/lib/utils/pagination";
import { MomentsPage } from "@/features/moment/route-entries";

export default async function MomentsRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; topic?: string | string[] }>;
}) {
  const params = await searchParams;
  const page = parsePageParam((Array.isArray(params.page) ? params.page[0] : params.page) ?? null);
  const topic = (Array.isArray(params.topic) ? params.topic[0] : params.topic) || undefined;
  const initialData = await getPublicMomentsInitialData(12, page, topic);
  return <MomentsPage initialData={initialData} />;
}
