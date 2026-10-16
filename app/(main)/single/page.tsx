import { BlogIndex } from "./blog-index";
import { getPublicJournalInitialData } from "@/lib/features/post/public-journal";

export default async function BlogIndexPage() {
  const initialData = await getPublicJournalInitialData();
  return <BlogIndex initialData={initialData} />;
}
