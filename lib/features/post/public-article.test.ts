import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicArticle, stripViewerState } from "./public-article";
import type { PostResponse } from "./post-contracts";

const article = {
  id: 7,
  title: "Cached essay",
  slug: "cached essay",
  coverImage: null,
  shaderPreset: "mesh-aurora",
  summary: "A public summary",
  content: "{}",
  contentType: "JSON",
  status: "PUBLISHED",
  isFeatured: false,
  views: 4,
  likesCount: 2,
  favoritesCount: 1,
  isLiked: true,
  isFavorited: true,
  isInReadingList: true,
  authorName: "wei.li",
  authorAvatar: null,
  category: null,
  series: null,
  seriesOrder: null,
  tags: [{ id: 1, name: "Notes", slug: "notes", createdAt: "2026-10-01T00:00:00Z" }],
  publishedAt: "2026-10-01T00:00:00Z",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  navigation: null,
} satisfies PostResponse;

function response(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("stripViewerState", () => {
  it("clears viewer-specific flags before the article enters the shared cache", () => {
    const stripped = stripViewerState(article);
    expect(stripped.isLiked).toBe(false);
    expect(stripped.isFavorited).toBe(false);
    expect(stripped.isInReadingList).toBe(false);
    expect(stripped.likesCount).toBe(2);
  });
});

describe("getPublicArticle", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("encodes the slug once and returns public content without viewer state", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/");
    const fetchMock = vi.fn().mockResolvedValue(response(200, { data: article }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getPublicArticle("cached essay");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/public/blog/posts/cached%20essay",
      { next: { revalidate: 60 } }
    );
    expect(result).toMatchObject({
      status: "ok",
      article: {
        isLiked: false,
        isFavorited: false,
        isInReadingList: false,
        title: "Cached essay",
      },
    });
  });

  it("uses the local API when the public base URL is empty in development", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = vi.fn().mockResolvedValue(response(200, { data: article }));
    vi.stubGlobal("fetch", fetchMock);

    await getPublicArticle("cached essay");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/v1/public/blog/posts/cached%20essay",
      { next: { revalidate: 60 } }
    );
  });

  it("distinguishes a missing article from a failed request", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(404))
      .mockResolvedValueOnce(response(500))
      .mockResolvedValueOnce(response(200, { data: { title: "incomplete" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPublicArticle("missing")).resolves.toEqual({ status: "not-found" });
    await expect(getPublicArticle("down")).resolves.toEqual({ status: "error" });
    await expect(getPublicArticle("malformed")).resolves.toEqual({ status: "error" });
  });
});
