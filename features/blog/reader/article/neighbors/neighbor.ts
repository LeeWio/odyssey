import type { ColumnPost } from "@/lib/features/column";
import type { PostDigestResponse, PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export interface ArticleNeighbor {
  publishedAt?: string | null;
  slug: string;
  title: string;
}

export type NeighborOrder = "column" | "time";

function publishedTime(value: string | null | undefined, fallback: number) {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? fallback : time;
}

function fromNavigation(neighbor: { slug: string; title: string } | null | undefined) {
  if (!neighbor?.slug) return null;
  return { slug: neighbor.slug, title: neighbor.title };
}

export function resolveArticleNeighbors({
  article,
  columnPosts,
  journalPosts,
}: {
  article: PostResponse;
  columnPosts: ColumnPost[];
  journalPosts: PostDigestResponse[];
}): { next: ArticleNeighbor | null; order: NeighborOrder; previous: ArticleNeighbor | null } {
  const fromApi = {
    next: fromNavigation(article.navigation?.next),
    previous: fromNavigation(article.navigation?.prev),
  };
  if (fromApi.previous || fromApi.next) {
    return { ...fromApi, order: article.series ? "column" : "time" };
  }

  if (article.series) {
    const posts = [...columnPosts].sort(
      (left, right) =>
        publishedTime(left.publishedAt, left.id) - publishedTime(right.publishedAt, right.id)
    );
    const here = posts.findIndex((post) => post.slug === article.slug);
    return {
      next: here >= 0 ? (posts[here + 1] ?? null) : null,
      order: "column",
      previous: here > 0 ? posts[here - 1] : null,
    };
  }

  const posts = [...journalPosts].sort(
    (left, right) =>
      publishedTime(getPostPublishedAt(left), left.id) -
      publishedTime(getPostPublishedAt(right), right.id)
  );
  const here = posts.findIndex((post) => post.slug === article.slug);

  return {
    next: here >= 0 ? (posts[here + 1] ?? null) : null,
    order: "time",
    previous: here > 0 ? posts[here - 1] : null,
  };
}
