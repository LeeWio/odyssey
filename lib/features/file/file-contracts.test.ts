import { describe, expect, it } from "vitest";

import { FileResponseSchema } from "./file-contracts";

const legacyUploadResponse = {
  fileName: "stored.webp",
  originalName: "moment.webp",
  fileUrl: "/uploads/stored.webp",
  thumbnailUrl: null,
  width: 1200,
  height: 900,
  fileSize: 1024,
  fileType: "image/webp",
  createdAt: "2026-08-16T10:00:00Z",
};

describe("FileResponseSchema", () => {
  it("accepts an upload response from the previous Nexus rollout", () => {
    expect(FileResponseSchema.parse(legacyUploadResponse).id).toBeUndefined();
  });

  it("preserves the stable file ID from the current Nexus API", () => {
    expect(FileResponseSchema.parse({ ...legacyUploadResponse, id: 42 }).id).toBe(42);
  });
});
