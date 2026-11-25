import { describe, expect, it } from "vitest";
import { parseCommentDocument, serializeCommentDocument } from "./comment-document";

const paragraph = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

describe("parseCommentDocument", () => {
  it("preserves legacy line breaks and treats markup as literal text", () => {
    expect(parseCommentDocument("First line\r\n\r\n<em>literal text</em>")).toEqual({
      type: "doc",
      content: [paragraph("First line"), { type: "paragraph" }, paragraph("<em>literal text</em>")],
    });
  });

  it("keeps the marks in a structured rich text comment", () => {
    const document = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Bold", marks: [{ type: "bold" }] }] },
      ],
    };
    expect(parseCommentDocument(serializeCommentDocument(document))).toEqual(document);
  });
});
