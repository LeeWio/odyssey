import type { Metadata } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { getPublicArticle } from "@/lib/features/post/public-article";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicArticle(slug);
  if (result.status !== "ok") return {};

  const article = result.article;
  const title = article.title || "Article";
  const description = article.summary || undefined;
  const tags = article.tags?.map((tag) => tag.name).filter((tag): tag is string => Boolean(tag));
  const publishedTime = article.publishedAt || undefined;
  const modifiedTime = article.updatedAt || undefined;

  return {
    title,
    description,
    authors: article.authorName ? [{ name: article.authorName }] : undefined,
    keywords: tags,
    alternates: { canonical: `${siteConfig.url}/single/${encodeURIComponent(slug)}` },
    openGraph: {
      type: "article",
      title,
      description,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
      publishedTime,
      modifiedTime,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category?.name || undefined,
      tags,
    },
    twitter: {
      card: article.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return children;
}
