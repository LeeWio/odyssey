import { describe, expect, it } from "vitest";
import { getTransformStyles } from "@/features/moment/utils/transform-styles";
import { parseMomentContent } from "@/features/moment/utils/content-parser";

describe("Moment Card Utility Helpers", () => {
  describe("getTransformStyles", () => {
    it("handles 1 image with neutral rotation", () => {
      expect(getTransformStyles(1)).toEqual(["rotate(0deg)"]);
    });

    it("handles 2 images with balanced offsets", () => {
      const styles = getTransformStyles(2);
      expect(styles).toHaveLength(2);
      expect(styles[0]).toContain("rotate(-3deg)");
      expect(styles[1]).toContain("rotate(3deg)");
    });

    it("handles 3 images with center image straight", () => {
      const styles = getTransformStyles(3);
      expect(styles).toHaveLength(3);
      expect(styles[0]).toContain("translateX(-90px)");
      expect(styles[1]).toBe("rotate(1deg)");
      expect(styles[2]).toContain("translateX(90px)");
    });

    it("handles 4 images", () => {
      const styles = getTransformStyles(4);
      expect(styles).toHaveLength(4);
      expect(styles[0]).toContain("translateX(-110px)");
      expect(styles[3]).toContain("translateX(110px)");
    });

    it("defaults to 5 images layout for larger or custom sizes", () => {
      const styles = getTransformStyles(5);
      expect(styles).toHaveLength(5);
      expect(styles[0]).toContain("translateX(-120px)");
      expect(styles[4]).toContain("translateX(118px)");
    });
  });

  describe("parseMomentContent", () => {
    it("parses valid JSONContent strings", () => {
      const mockDoc = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Test note." }],
          },
        ],
      };
      const jsonString = JSON.stringify(mockDoc);
      const parsed = parseMomentContent(jsonString);

      expect(parsed).toMatchObject({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Test note." }],
          },
        ],
      });
    });

    it("gracefully falls back to paragraph text for non-JSON content", () => {
      const rawText = "This is a simple raw field note.";
      const parsed = parseMomentContent(rawText);

      expect(parsed).toMatchObject({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: rawText }],
          },
        ],
      });
    });

    it("gracefully falls back to raw string for empty or corrupted json-like content", () => {
      const badJson = "{broken json string";
      const parsed = parseMomentContent(badJson);

      expect(parsed).toMatchObject({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: badJson }],
          },
        ],
      });
    });
  });
});
