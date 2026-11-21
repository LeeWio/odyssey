import { notFound } from "next/navigation";

import { getTranslations } from "next-intl/server";
import {
  ArticleReadingDocument,
  prepareArticleReading,
} from "@/features/blog/reader/article/article-reading-document";
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

  const t = await getTranslations("Article");
  const document = prepareArticleReading(result.article.content, result.article.contentType);
  return (
    <ArticlePageClient
      initialArticle={{ ...result.article, content: null, translations: undefined }}
      outline={
        document?.headings.length ? { label: t("onThisPage"), items: document.headings } : null
      }
      readingMinutes={document?.minutes ?? null}
      body={
        <ArticleReadingDocument key={slug} document={document} fallback={t("unsupportedContent")} />
      }
      slug={slug}
    />
  );
}
