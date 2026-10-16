import { getPublicJournalInitialData } from "@/lib/features/post/public-journal";

import ChroniclePageClient from "./chronicle-page-client";

export default async function ChroniclePage() {
  const initialData = await getPublicJournalInitialData({ featuredSize: 1, latestSize: 3 });
  return <ChroniclePageClient initialData={initialData} />;
}
