import { describe, expect, it } from "vitest";
import { getTransformStyles } from "@/features/moment/utils/transform-styles";
import {
  extractMomentPlainText,
  parseMomentContent,
  isDocumentEmpty,
} from "@/features/moment/utils/content-parser";

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
      expect(styles[0]).toContain("translateX(-60px)");
      expect(styles[1]).toBe("rotate(1deg) translateY(-4px)");
      expect(styles[2]).toContain("translateX(60px)");
    });

    it("handles 4 images", () => {
      const styles = getTransformStyles(4);
      expect(styles).toHaveLength(4);
      expect(styles[0]).toContain("translateX(-75px)");
      expect(styles[3]).toContain("translateX(75px)");
    });

    it("handles 5 images", () => {
      const styles = getTransformStyles(5);
      expect(styles).toHaveLength(5);
      expect(styles[0]).toContain("translateX(-80px)");
      expect(styles[4]).toContain("translateX(80px)");
    });

    it("handles 6 images", () => {
      const styles = getTransformStyles(6);
      expect(styles).toHaveLength(6);
      expect(styles[0]).toContain("translateX(-85px)");
      expect(styles[5]).toContain("translateX(85px)");
    });

    it("handles 7 images", () => {
      const styles = getTransformStyles(7);
      expect(styles).toHaveLength(7);
      expect(styles[0]).toContain("translateX(-90px)");
      expect(styles[6]).toContain("translateX(90px)");
    });

    it("handles 8 images and caps larger values to 8", () => {
      const styles = getTransformStyles(8);
      expect(styles).toHaveLength(8);
      expect(styles[0]).toContain("translateX(-95px)");
      expect(styles[7]).toContain("translateX(95px)");

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

  describe("extractMomentPlainText", () => {
    it("flattens TipTap JSON into readable preview text", () => {
      const content = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "First line" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Second line" }],
          },
        ],
      });

      expect(extractMomentPlainText(content)).toBe("First line\n\nSecond line");
    });

    it("preserves inline hard breaks and blank lines between paragraphs", () => {
      const content = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "这世上很难找到一个无亲无故的人。" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "有牵挂，就会有期待；" },
              { type: "hardBreak" },
              { type: "text", text: "有期待，就难免有评价。" },
            ],
          },
          { type: "paragraph", content: [{ type: "text", text: "就已经很好了。" }] },
        ],
      });
      expect(extractMomentPlainText(content)).toBe(
        "这世上很难找到一个无亲无故的人。\n\n有牵挂，就会有期待；\n有期待，就难免有评价。\n\n就已经很好了。"
      );
    });

    it("retains consecutive and trailing hard breaks inside a paragraph", () => {
      expect(
        extractMomentPlainText(
          JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "One" },
                  { type: "hardBreak" },
                  { type: "hardBreak" },
                  { type: "text", text: "Two" },
                  { type: "hardBreak" },
                ],
              },
              { type: "paragraph", content: [{ type: "text", text: "Three" }] },
            ],
          })
        )
      ).toBe("One\n\nTwo\n\n\nThree");
    });

    it("preserves empty interior paragraphs but treats break-only documents as empty", () => {
      expect(
        extractMomentPlainText(
          JSON.stringify({
            type: "doc",
            content: [
              { type: "paragraph", content: [{ type: "text", text: "Before" }] },
              { type: "paragraph" },
              { type: "paragraph", content: [{ type: "text", text: "After" }] },
            ],
          })
        )
      ).toBe("Before\n\n\n\nAfter");
      expect(
        isDocumentEmpty({
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "hardBreak" }] }],
        })
      ).toBe(true);
    });

    it("preserves legacy multiline text without adding paragraph separators", () => {
      expect(extractMomentPlainText("First\nSecond\n\nThird")).toBe("First\nSecond\n\nThird");
    });

    it("returns legacy plain text unchanged", () => {
      expect(extractMomentPlainText("Field note")).toBe("Field note");
    });
  });
});
