import { describe, expect, it } from "vitest";

import { MomentResponseSchema } from "./moment-contracts";

const baseMoment = {
  id: 7,
  content: "A short field note.",
  likesCount: 3,
  visibility: "public",
  createdAt: "2026-08-16T10:00:00Z",
  updatedAt: "2026-08-16T10:00:00Z",
};

describe("MomentResponseSchema", () => {
  it("preserves ordered image metadata", () => {
    const parsed = MomentResponseSchema.parse({
      ...baseMoment,
      images: [
        {
          id: 11,
          fileId: 91,
          originalName: "studio-window.webp",
          fileUrl: "/uploads/studio-window.webp",
          thumbnailUrl: "/uploads/thumbnails/studio-window.webp",
          width: 1600,
          height: 1200,
          altText: "Late light crossing the studio window",
          sortOrder: 0,
        },
      ],
    });

    expect(parsed.images).toHaveLength(1);
    expect(parsed.images[0]).toMatchObject({ fileId: 91, sortOrder: 0 });
  });

  it("defaults legacy text-only responses to an empty image list", () => {
    expect(MomentResponseSchema.parse(baseMoment).images).toEqual([]);
  });
});
