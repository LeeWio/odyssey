import { describe, expect, it } from "vitest";

import {
  MOMENT_MAX_IMAGE_SIZE,
  defaultMomentAltText,
  validateMomentImageFile,
} from "../utils/media-limits";

function makeFile(name: string, type: string, size = 1024) {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("moment media limits", () => {
  it("accepts supported image types under the size cap", () => {
    expect(validateMomentImageFile(makeFile("shot.webp", "image/webp"))).toBeNull();
    expect(validateMomentImageFile(makeFile("shot.jpg", "image/jpeg"))).toBeNull();
  });

  it("rejects unsupported types and oversized files", () => {
    expect(validateMomentImageFile(makeFile("notes.txt", "text/plain"))).toMatch(
      /JPEG, PNG, GIF, or WebP/
    );
    expect(
      validateMomentImageFile(makeFile("huge.png", "image/png", MOMENT_MAX_IMAGE_SIZE + 1))
    ).toMatch(/10 MB/);
  });

  it("derives readable alt text from file names", () => {
    expect(defaultMomentAltText("field-note_01.webp")).toBe("field note 01");
    expect(defaultMomentAltText(".hidden")).toBe("Moment Attachment");
  });
});
