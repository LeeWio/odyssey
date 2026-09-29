import type { Metadata } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";

type ArticleMetadata = {
  title?: string;
  summary?: string | null;
  coverImage?: string | null;
  authorName?: string | null;
  category?: { name?: string | null } | null;
  tags?: Array<{ name?: string | null }> | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

async function getArticleMetadata(slug: string): Promise<ArticleMetadata | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return null;

  try {
    const response = await fetch(
      `${apiBase}/api/v1/public/blog/posts/${encodeURIComponent(slug)}`,
      {
        next: { revalidate: 60 },
      }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: ArticleMetadata };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleMetadata(slug);
  if (!article) return {};

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
