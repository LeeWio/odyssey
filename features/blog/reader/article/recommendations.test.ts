import { describe, expect, it } from "vitest";

import type { PostDigestResponse } from "@/lib/features/post";

import { continueReadingRail, sameSubjectPosts } from "./recommendations";

function category(name: string, slug = name.toLowerCase()) {
  return {
    createdAt: "2026-01-01T00:00:00Z",
    description: "",
    icon: "",
    id: 1,
    name,
    slug,
  };
}

function digest(overrides: Partial<PostDigestResponse> = {}): PostDigestResponse {
  return {
    authorAvatar: "",
    authorName: "wei.li",
    category: category("Notes", "notes"),
    commentsCount: 0,
    coverImage: "",
    id: 2,
    likesCount: 4,
    publishedAt: "2026-11-01T00:00:00Z",
    shaderPreset: null,
    slug: "other",
    summary: "A short line.",
    title: "Other",
    views: 9,
    ...overrides,
  };
}

describe("sameSubjectPosts", () => {
  it("drops the current article and keeps the related order", () => {
    const posts = sameSubjectPosts({ slug: "current" }, [
      digest({ slug: "current", title: "Current" }),
      digest({ id: 3, slug: "a", title: "A" }),
      digest({ id: 4, slug: "b", title: "B" }),
      digest({ id: 5, slug: "c", title: "C" }),
      digest({ id: 6, slug: "d", title: "D" }),
    ]);

    expect(posts.map((post) => post.slug)).toEqual(["a", "b", "c", "d"]);
  });

  it("uses the shared category as the reason, and the date when there is none", () => {
    const posts = sameSubjectPosts({ slug: "current" }, [
      digest({
        category: category("  Machines  ", "machines"),
        coverImage: "  ",
        shaderPreset: "mesh-aurora",
        slug: "shared",
      }),
      digest({
        category: null,
        publishedAt: "2026-10-02T00:00:00Z",
        slug: "dated",
        summary: "   ",
      }),
    ]);

    expect(posts[0]?.coverImage).toBeNull();
    expect(posts[0]?.shaderPreset).toBe("mesh-aurora");
    expect(posts[0]?.relation).toEqual({ category: "Machines" });
    expect(posts[0]?.summary).toBe("A short line.");
    expect(posts[1]?.relation).toEqual({ date: "2026-10-02T00:00:00Z" });
    expect(posts[1]?.summary).toBeNull();
  });

  it("returns nothing when related posts are missing", () => {
    expect(sameSubjectPosts({ slug: "current" }, undefined)).toEqual([]);
  });
});

describe("continueReadingRail", () => {
  const subject = sameSubjectPosts({ slug: "current" }, [
    digest({ slug: "a" }),
    digest({ id: 3, slug: "b" }),
    digest({ id: 4, slug: "c" }),
  ]);

  it("keeps next together with the related list", () => {
    const rail = continueReadingRail({ slug: "next", title: "Next" }, subject);

    expect(rail?.next?.slug).toBe("next");
    expect(rail?.sameSubject.map((post) => post.slug)).toEqual(["a", "b", "c"]);
  });

  it("stays empty when there is no next piece and no same subject", () => {
    expect(continueReadingRail(null, [])).toBeNull();
  });

  it("still appears when only the next piece exists", () => {
    expect(continueReadingRail({ slug: "next", title: "Next" }, [])?.sameSubject).toEqual([]);
  });
});
