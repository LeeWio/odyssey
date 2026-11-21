import { BlogIndex } from "@/features/blog/index/blog-index";
import { getPublicJournalInitialData } from "@/lib/features/post/server";
import { parseJournalQuery } from "@/lib/features/post/journal-query";

export default async function BlogIndexPage({ searchParams }: PageProps<"/single">) {
  const params = await searchParams;
  const query = parseJournalQuery((key) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  });
  const initialData = await getPublicJournalInitialData({ query });
  return <BlogIndex initialData={initialData} />;
}
