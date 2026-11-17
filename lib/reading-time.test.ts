import { describe, expect, it } from "vitest";

import { readingMinutes } from "./reading-time";

const documentWith = (text: string, attrs?: Record<string, string>) =>
  JSON.stringify({
    type: "doc",
    ...(attrs ? { attrs } : {}),
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });

describe("readingMinutes", () => {
  it("counts visible Tiptap text instead of JSON markup", () => {
    expect(readingMinutes(documentWith("Hello world from the editor."), "JSON")).toBe(1);
  });

  it("estimates Chinese reading time from characters", () => {
    expect(readingMinutes(documentWith("读".repeat(520)), "JSON")).toBe(2);
  });

  it("ignores document attributes that are not visible text", () => {
    const visible = documentWith("可见正文");
    const padded = documentWith("可见正文", { id: "type".repeat(40) });

    expect(readingMinutes(padded, "JSON")).toBe(readingMinutes(visible, "JSON"));
  });

  it("returns one minute when the document cannot be read", () => {
    expect(readingMinutes("not json", "JSON")).toBe(1);
    expect(readingMinutes(null, "MDX")).toBe(1);
  });
});
