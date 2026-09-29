import { describe, expect, it } from "vitest";

import { getPostPublishedAt } from "./post-dates";

describe("getPostPublishedAt", () => {
  it("prefers the publication timestamp", () => {
    expect(
      getPostPublishedAt({
        createdAt: "2026-09-01T00:00:00Z",
        publishedAt: "2026-09-15T00:00:00Z",
      })
    ).toBe("2026-09-15T00:00:00Z");
  });

  it("falls back to creation time for legacy posts", () => {
    expect(getPostPublishedAt({ createdAt: "2026-09-01T00:00:00Z", publishedAt: null })).toBe(
      "2026-09-01T00:00:00Z"
    );
    expect(getPostPublishedAt({ createdAt: null, publishedAt: null })).toBeNull();
  });
});
