import { getPublicJournalInitialData } from "@/lib/features/post/server";
import { ChroniclePage } from "@/features/chronicle";

export default async function ChronicleRoute() {
  const initialData = await getPublicJournalInitialData({ featuredSize: 1, latestSize: 3 });
  return <ChroniclePage initialData={initialData} />;
}
