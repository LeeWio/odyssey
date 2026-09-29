import { PostResponseSchema, type PostResponse } from "@/lib/features/post";

import ArticlePageClient from "./article-page-client";

async function getInitialArticle(slug: string): Promise<PostResponse | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return null;

  try {
    const response = await fetch(
      `${apiBase}/api/v1/public/blog/posts/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("data" in payload)) return null;

    const parsed = PostResponseSchema.safeParse(payload.data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

interface SinglePageProps {
  params: Promise<{ slug: string }>;
}

export default async function SinglePage({ params }: SinglePageProps) {
  const { slug } = await params;
  const initialArticle = await getInitialArticle(slug);

  return <ArticlePageClient initialArticle={initialArticle} slug={slug} />;
}
