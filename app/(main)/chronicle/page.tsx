import { getPublicJournalInitialData } from "@/lib/features/post/server";

import ChroniclePageClient from "./chronicle-page-client";

export default async function ChroniclePage() {
  const initialData = await getPublicJournalInitialData({ featuredSize: 1, latestSize: 3 });
  return <ChroniclePageClient initialData={initialData} />;
}
