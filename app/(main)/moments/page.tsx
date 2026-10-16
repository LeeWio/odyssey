import { getPublicMomentsInitialData } from "@/lib/features/moment/public-moments";

import MomentsPageClient from "./moments-page-client";

export default async function MomentsPage() {
  const initialData = await getPublicMomentsInitialData();
  return <MomentsPageClient initialData={initialData} />;
}
