import type { ArticleNeighbor } from "./neighbors";
import type { PostDigestResponse, PostResponse } from "@/lib/features/post";
import { getPostPublishedAt } from "@/lib/features/post/post-dates";

export const SAME_SUBJECT_LIMIT = 3;
/** Related posts requested for the rail. The endpoint defaults to 6. */
export const ALSO_LIKE_LIMIT = 12;

export interface ReadingRecommendation {
  coverImage: string | null;
  publishedAt: string | null;
  shaderPreset: string | null;
  slug: string;
  summary: string | null;
  title: string;
}

export interface SameSubjectRecommendation extends ReadingRecommendation {
  relation: { category: string } | { date: string | null };
}

export function sameSubjectPosts(
  article: Pick<PostResponse, "slug">,
  related: PostDigestResponse[] | undefined
): SameSubjectRecommendation[] {
  return (related ?? [])
    .filter((post) => post.slug && post.slug !== article.slug)
    .map((post) => {
      const publishedAt = getPostPublishedAt(post);
      const category = post.category?.name?.trim();
      return {
        coverImage: post.coverImage?.trim() || null,
        publishedAt,
        relation: category ? { category } : { date: publishedAt },
        shaderPreset: post.shaderPreset,
        slug: post.slug,
        summary: post.summary?.trim() || null,
        title: post.title,
      };
    });
}

/** Right rail: the next piece, then the related list. Empty means no rail. */
export function continueReadingRail(
  next: ArticleNeighbor | null,
  sameSubject: SameSubjectRecommendation[]
): { next: ArticleNeighbor | null; sameSubject: SameSubjectRecommendation[] } | null {
  const subject = sameSubject;
  if (!next && subject.length === 0) return null;
  return { next, sameSubject: subject };
}
