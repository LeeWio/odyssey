import { afterEach, describe, expect, it, vi } from "vitest";

import * as requestLocale from "@/lib/i18n/request-locale";
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
    vi.restoreAllMocks();
  });

  it("encodes the slug once and returns public content without viewer state", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(200, { code: 200, message: "OK", data: article }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getPublicArticle("cached essay");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/public/blog/posts/cached%20essay",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/json",
          "x-odyssey-prefetch": "1",
        }),
        next: { revalidate: 60, tags: ["article:cached essay"] },
      })
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
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response(200, { code: 200, message: "OK", data: article }));
    vi.stubGlobal("fetch", fetchMock);

    await getPublicArticle("cached essay");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/api/v1/public/blog/posts/cached%20essay",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/json",
          "x-odyssey-prefetch": "1",
        }),
        next: { revalidate: 60, tags: ["article:cached essay"] },
      })
    );
  });

  it.each([
    { locale: "en", title: "原文标题", summary: "原文摘要", content: "原文正文", tag: "Notes" },
    {
      locale: "zh",
      title: "Original title",
      summary: "Original summary",
      content: "Original body",
      tag: "笔记",
    },
  ] as const)(
    "uses authored article fields with the $locale interface and still localizes tags",
    async ({ locale, title, summary, content, tag }) => {
      vi.spyOn(requestLocale, "getRequestLocale").mockResolvedValue(locale);
      vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test");
      const data = {
        ...article,
        title,
        summary,
        content,
        tags: [
          {
            ...article.tags[0],
            name: "笔记",
            translations: { en: { name: "Notes" }, zh: { name: "笔记" } },
          },
        ],
        translations: {
          en: { title: "Translated title", summary: null, content: "Translated body" },
          zh: { title: "译文标题", summary: "译文摘要", content: "译文正文", toc: null },
        },
      };
      const fetchMock = vi
        .fn()
        .mockResolvedValue(response(200, { code: 200, message: "OK", data }));
      vi.stubGlobal("fetch", fetchMock);

      const result = await getPublicArticle("cached essay");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: expect.objectContaining({ "accept-language": locale }) })
      );
      expect(result).toMatchObject({ status: "ok", article: { title, summary, content } });
      if (result.status !== "ok") throw new Error("Expected a published article");
      expect(result.article.tags?.[0].name).toBe(tag);
      expect(result.article).not.toHaveProperty("translations");
    }
  );

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
