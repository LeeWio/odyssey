import { describe, expect, it } from "vitest";

import { normalizeMomentTopicSlug } from "./topic-slug";

describe("normalizeMomentTopicSlug", () => {
  it("matches the server normalization for multilingual hashtags", () => {
    expect(normalizeMomentTopicSlug("#Frontend Architecture")).toBe("frontend-architecture");
    expect(normalizeMomentTopicSlug("#上海 Summer")).toBe("上海-summer");
  });

  it("rejects values beyond the canonical slug limit", () => {
    expect(normalizeMomentTopicSlug("a".repeat(81))).toBe("");
  });
});
