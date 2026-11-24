import "server-only";

import { z } from "zod";

import { fetchServerApiJson } from "@/lib/api/server-client";
import { ColumnResponseSchema } from "@/lib/features/column/column-contracts";

import { PostResponseSchema } from "./post-contracts";

export type JournalReadingPick = {
  id: "series" | "diagrams" | "essays";
  leadHref: string;
  moreHref?: string;
  amount?: number;
};

const columnSlug = "understanding-max96781";
const firstChapterSlug = "max96781-automotive-display-overview";
const diagramSlug = "sa8295p-display-architecture-features";
const followUpSlug = "dp0-dp02";
const essaySlug = "memories-of-grandpa";
const articleHref = (slug: string) => `/single/${encodeURIComponent(slug)}`;

const pickPostSchema = PostResponseSchema.pick({ slug: true, category: true }).extend({
  readingTimeMinutes: z.number().nullish(),
});

async function readPost(slug: string) {
  return fetchServerApiJson(`/api/v1/public/blog/posts/${slug}`, pickPostSchema, {
    revalidate: 60,
    tags: [`article:${slug}`],
  });
}

export async function getJournalReadingPicks(): Promise<JournalReadingPick[]> {
  const [{ data: column }, { data: diagram }, { data: essay }, followUp] = await Promise.all([
    fetchServerApiJson(
      `/api/v1/public/columns/${columnSlug}`,
      ColumnResponseSchema.pick({ slug: true, isPublished: true, postsCount: true, posts: true }),
      { revalidate: 60 }
    ),
    readPost(diagramSlug),
    readPost(essaySlug),
    readPost(followUpSlug),
  ]);

  const picks: JournalReadingPick[] = [];
  const firstChapter = column?.posts.find((post) => post.slug === firstChapterSlug);
  if (column?.isPublished && firstChapter) {
    picks.push({
      id: "series",
      leadHref: articleHref(firstChapter.slug),
      moreHref: `/columns/${column.slug}`,
      amount: column.postsCount,
    });
  }
  if (diagram) {
    picks.push({
      id: "diagrams",
      leadHref: articleHref(diagram.slug),
      moreHref: followUp.data ? articleHref(followUp.data.slug) : undefined,
      amount: diagram.readingTimeMinutes ?? undefined,
    });
  }
  if (essay) {
    picks.push({
      id: "essays",
      leadHref: articleHref(essay.slug),
      moreHref: essay.category?.slug
        ? `/single/categories/${encodeURIComponent(essay.category.slug)}`
        : undefined,
      amount: essay.readingTimeMinutes ?? undefined,
    });
  }

  return picks;
}
