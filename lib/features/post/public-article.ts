import { cache } from "react";
import { type AppLocale } from "@/i18n/locale";
import { fetchServerApiJson } from "@/lib/api/server-client";
import { getRequestLocale } from "@/lib/i18n/request-locale";

import { PostResponseSchema, type PostResponse } from "./post-contracts";

const REVALIDATE_SECONDS = 60;

export type PublicArticleResult =
  { status: "ok"; article: PostResponse } | { status: "not-found" } | { status: "error" };

/**
 * Published article content is safe to share across visitors.
 * Viewer-specific flags stay false here and are filled by the authenticated client query.
 */
export function stripViewerState(article: PostResponse): PostResponse {
  return {
    ...article,
    isLiked: false,
    isFavorited: false,
    isInReadingList: false,
  };
}

const getPublicArticleForLocale = cache(
  async (slug: string, locale?: AppLocale): Promise<PublicArticleResult> => {
    const result = await fetchServerApiJson(
      `/api/v1/public/blog/posts/${encodeURIComponent(slug)}`,
      PostResponseSchema,
      { locale, revalidate: REVALIDATE_SECONDS, tags: [`article:${slug}`] }
    );
    if (result.status === 404) return { status: "not-found" };
    if (!result.data) return { status: "error" };
    return { status: "ok", article: stripViewerState(result.data) };
  }
);

export async function getPublicArticle(slug: string): Promise<PublicArticleResult> {
  try {
    return getPublicArticleForLocale(slug, await getRequestLocale());
  } catch {
    return getPublicArticleForLocale(slug);
  }
}
