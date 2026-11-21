import { BlogIndex } from "@/features/blog/index/blog-index";
import { getPublicJournalInitialData } from "@/lib/features/post/server";
import { parseJournalQuery } from "@/lib/features/post/journal-query";

interface BlogIndexPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const params = await searchParams;
  const query = parseJournalQuery((key) => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  });
  const initialData = await getPublicJournalInitialData({ query });
  return <BlogIndex initialData={initialData} />;
}
