import { cache } from "react";

import { PostResponseSchema, type PostResponse } from "./post-contracts";

const REVALIDATE_SECONDS = 60;

export type PublicArticleResult =
  { status: "ok"; article: PostResponse } | { status: "not-found" } | { status: "error" };

function apiOrigin() {
  const configured =
    process.env.API_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  // Local dev leaves the public base empty and proxies /api through Next.
  // Server fetches do not pass through that rewrite, so call the API directly.
  return process.env.NODE_ENV === "development" ? "http://127.0.0.1:8080" : "";
}

function publicPostUrl(slug: string) {
  const origin = apiOrigin();
  if (!origin) return null;
  return `${origin}/api/v1/public/blog/posts/${encodeURIComponent(slug)}`;
}

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

export const getPublicArticle = cache(async (slug: string): Promise<PublicArticleResult> => {
  const url = publicPostUrl(slug);
  if (!url) return { status: "error" };

  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (response.status === 404) return { status: "not-found" };
    if (!response.ok) return { status: "error" };

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("data" in payload)) {
      return { status: "error" };
    }

    const parsed = PostResponseSchema.safeParse(payload.data);
    if (!parsed.success) return { status: "error" };

    return { status: "ok", article: stripViewerState(parsed.data) };
  } catch {
    return { status: "error" };
  }
});
