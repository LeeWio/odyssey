import { describe, expect, it } from "vitest";

import {
  PostDigestResponseSchema,
  PostResponseSchema,
  PostStatusSchema,
  UnifiedSearchResponseSchema,
} from "./post-contracts";

const basePost = {
  id: 1,
  title: "Odyssey Notes",
  slug: "odyssey-notes",
  coverImage: null,
  summary: null,
  content: null,
  status: "PUBLISHED",
  isFeatured: false,
  views: 12,
  likesCount: 3,
  favoritesCount: 1,
  isLiked: false,
  isFavorited: false,
  authorName: "wei.li",
  authorAvatar: "",
  category: null,
  series: null,
  seriesOrder: null,
  tags: [],
  createdAt: "2026-09-16T00:00:00Z",
  updatedAt: "2026-09-16T00:00:00Z",
};

describe("PostStatusSchema", () => {
  it("accepts known workflow statuses", () => {
    expect(PostStatusSchema.parse("DRAFT")).toBe("DRAFT");
    expect(PostStatusSchema.parse("PUBLISHED")).toBe("PUBLISHED");
  });
});

describe("PostResponseSchema", () => {
  it("defaults missing contentType and empty optional collections", () => {
    const withoutOptionals = Object.fromEntries(
      Object.entries(basePost).filter(([key]) => !["coverImage", "summary", "tags"].includes(key))
    );
    const parsed = PostResponseSchema.parse(withoutOptionals);
    expect(parsed.contentType).toBe("JSON");
    expect(parsed.coverImage).toBe("");
    expect(parsed.summary).toBe("");
    expect(parsed.tags).toEqual([]);
    expect(parsed.navigation).toBeNull();
  });

  it("preserves explicit null media fields from the API", () => {
    const parsed = PostResponseSchema.parse(basePost);
    expect(parsed.coverImage).toBeNull();
    expect(parsed.summary).toBeNull();
  });
});

describe("PostDigestResponseSchema", () => {
  it("coerces missing commentsCount to zero and defaults omitted author fields", () => {
    const parsed = PostDigestResponseSchema.parse({
      id: 2,
      title: "Digest",
      slug: "digest",
      category: null,
      views: 0,
      likesCount: 0,
    });
    expect(parsed.commentsCount).toBe(0);
    expect(parsed.authorName).toBe("Anonymous");
    expect(parsed.coverImage).toBe("");
  });
});

describe("UnifiedSearchResponseSchema", () => {
  it("defaults missing groups to an empty list", () => {
    expect(UnifiedSearchResponseSchema.parse({}).groups).toEqual([]);
  });
});
