export type JournalStory = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  summary?: string | null;
  coverImage?: string | null;
  shaderPreset?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  category?: { name?: string | null } | null;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  isInReadingList?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
};

export function formatJournalDate(
  value: string | null | undefined,
  locale: string,
  fallback: string
) {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function journalStoryDate(post: JournalStory) {
  if ("publishedAt" in post && post.publishedAt) return post.publishedAt;
  return "createdAt" in post ? post.createdAt : undefined;
}

export function journalStoryHref(post: JournalStory) {
  return post.slug ? `/single/${post.slug}` : "/single";
}

export function journalStoryKey(post: JournalStory) {
  return post.slug ?? String(post.id ?? "");
}

export function journalPageNumbers(page: number, totalPages: number) {
  const pages: (number | "ellipsis")[] = [];

  if (totalPages <= 7) {
    for (let index = 1; index <= totalPages; index += 1) pages.push(index);
    return pages;
  }

  pages.push(1);
  if (page > 3) pages.push("ellipsis");

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let index = start; index <= end; index += 1) pages.push(index);

  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}
