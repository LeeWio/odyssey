import { describe, expect, it } from "vitest";

import type { PostResponse } from "@/lib/features/post";

import { resolveArticleNeighbors } from "./neighbor";

function article(overrides: Partial<PostResponse> = {}): PostResponse {
  return {
    authorAvatar: "",
    authorName: "wei.li",
    category: null,
    content: "",
    contentType: "JSON",
    coverImage: "",
    createdAt: "2026-10-10T00:00:00Z",
    favoritesCount: 0,
    id: 1,
    isFavorited: false,
    isFeatured: false,
    isInReadingList: false,
    isLiked: false,
    likesCount: 0,
    navigation: null,
    publishedAt: "2026-10-10T00:00:00Z",
    scheduledAt: null,
    series: null,
    seriesOrder: null,
    shaderPreset: null,
    slug: "current",
    status: "PUBLISHED",
    summary: "",
    tags: [],
    title: "Current",
    updatedAt: "2026-10-10T00:00:00Z",
    views: 0,
    ...overrides,
  };
}

describe("resolveArticleNeighbors", () => {
  it("uses the article navigation when the API already has neighbors", () => {
    const neighbors = resolveArticleNeighbors({
      article: article({
        navigation: {
          next: { slug: "api-next", title: "API next" },
          prev: { slug: "api-prev", title: "API previous" },
        },
      }),
      columnPosts: [],
      journalPosts: [],
    });

    expect(neighbors.previous?.slug).toBe("api-prev");
    expect(neighbors.next?.slug).toBe("api-next");
    expect(neighbors.order).toBe("time");
  });

  it("falls back to publication time when navigation is empty", () => {
    const neighbors = resolveArticleNeighbors({
      article: article(),
      columnPosts: [],
      journalPosts: [
        {
          authorAvatar: "",
          authorName: "wei.li",
          category: null,
          commentsCount: 0,
          coverImage: "",
          id: 2,
          likesCount: 0,
          publishedAt: "2026-10-09T00:00:00Z",
          shaderPreset: null,
          slug: "older",
          summary: "",
          title: "Older",
          views: 0,
        },
        {
          authorAvatar: "",
          authorName: "wei.li",
          category: null,
          commentsCount: 0,
          coverImage: "",
          id: 3,
          likesCount: 0,
          publishedAt: "2026-10-12T00:00:00Z",
          shaderPreset: null,
          slug: "newer",
          summary: "",
          title: "Newer",
          views: 0,
        },
      ],
    });

    expect(neighbors.order).toBe("time");
    expect(neighbors.previous?.title).toBe("Older");
    expect(neighbors.next?.title).toBe("Newer");
  });
});
