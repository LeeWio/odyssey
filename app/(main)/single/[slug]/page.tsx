import { notFound } from "next/navigation";

import { readingHtml } from "@/components/rich-text/reading-html";
import { ArticlePageClient } from "@/features/blog/route-entries";
import { getPublicArticle } from "@/lib/features/post/server";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const result = await getPublicArticle(slug);

  if (result.status === "not-found") notFound();
  if (result.status === "error") {
    throw new Error("Article request failed");
  }

  return (
    <ArticlePageClient
      initialArticle={result.article}
      readingHtml={readingHtml(result.article.content, result.article.contentType)}
      slug={slug}
    />
  );
}
