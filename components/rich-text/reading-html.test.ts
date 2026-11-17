import { describe, expect, it } from "vitest";

import { readingHtml } from "./reading-html";

describe("readingHtml", () => {
  it("renders article text without a browser document", () => {
    const html = readingHtml(
      JSON.stringify({
        type: "doc",
        content: [
          {
            type: "details",
            content: [
              { type: "detailsSummary", content: [{ type: "text", text: "Notes" }] },
              { type: "detailsContent", content: [{ type: "paragraph" }] },
            ],
          },
          { type: "paragraph", content: [{ type: "text", text: "可见正文" }] },
        ],
      }),
      "JSON"
    );

    expect(html).toContain("可见正文");
    expect(html).toContain("Notes");
  });
});
