import { BlogIndex } from "@/features/blog/index/blog-index";
import { getPublicJournalInitialData } from "@/lib/features/post/server";

export default async function BlogIndexPage() {
  const initialData = await getPublicJournalInitialData();
  return <BlogIndex initialData={initialData} />;
}
