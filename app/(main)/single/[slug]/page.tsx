import { notFound } from "next/navigation";

import { getPublicArticle } from "@/lib/features/post/public-article";

import ArticlePageClient from "./article-page-client";

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

  return <ArticlePageClient initialArticle={result.article} slug={slug} />;
}
