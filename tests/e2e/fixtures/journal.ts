export const journalFallbackPrefix = "journal-mock-";

export const story = (id: number) => ({
  id,
  title:
    id === 4 ? "AnUnbrokenArticleTitle".repeat(4) : `Notes on building thoughtful software ${id}`,
  slug: `design-story-${id}`,
  summary: "A closer look at the decisions, experiments and small details behind the work.",
  coverImage: id === 22 || id % 3 === 0 ? "" : "/IMG_5332.JPG",
  authorName: "Odyssey",
  status: "PUBLISHED",
  isFeatured: id > 20,
  views: 124,
  likesCount: 8,
  favoritesCount: 0,
  isInReadingList: false,
  category: { id: 1, name: "Engineering", slug: "engineering", createdAt: "2026-10-01T00:00:00Z" },
  series: null,
  seriesOrder: null,
  publishedAt: "2026-10-01T04:43:43",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
});
export const stories = Array.from({ length: 12 }, (_, index) => story(index + 1));
export const featured = [story(22), story(23), story(24), story(25)];
