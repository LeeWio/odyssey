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
      expect(styles[0]).toContain("rotate(-4deg)");
      expect(styles[1]).toContain("rotate(4deg)");
    });

    it("handles 3 images with center image straight", () => {
      const styles = getTransformStyles(3);
      expect(styles).toHaveLength(3);
      expect(styles[0]).toContain("translateX(-90px)");
      expect(styles[1]).toBe("rotate(1deg) translateY(-4px)");
      expect(styles[2]).toContain("translateX(90px)");
    });

    it("handles 4 images", () => {
      const styles = getTransformStyles(4);
      expect(styles).toHaveLength(4);
      expect(styles[0]).toContain("translateX(-110px)");
      expect(styles[3]).toContain("translateX(110px)");
    });

    it("handles 5 images", () => {
      const styles = getTransformStyles(5);
      expect(styles).toHaveLength(5);
      expect(styles[0]).toContain("translateX(-120px)");
      expect(styles[4]).toContain("translateX(118px)");
    });

    it("handles 6 images", () => {
      const styles = getTransformStyles(6);
      expect(styles).toHaveLength(6);
      expect(styles[0]).toContain("translateX(-125px)");
      expect(styles[5]).toContain("translateX(125px)");
    });

    it("handles 7 images", () => {
      const styles = getTransformStyles(7);
      expect(styles).toHaveLength(7);
      expect(styles[0]).toContain("translateX(-132px)");
      expect(styles[6]).toContain("translateX(132px)");
    });

    it("handles 8 images and caps larger values to 8", () => {
      const styles = getTransformStyles(8);
      expect(styles).toHaveLength(8);
      expect(styles[0]).toContain("translateX(-140px)");
      expect(styles[7]).toContain("translateX(140px)");

      const overLimitStyles = getTransformStyles(12);
      expect(overLimitStyles).toHaveLength(8);
      expect(overLimitStyles).toEqual(styles);
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
