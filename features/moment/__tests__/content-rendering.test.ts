import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MomentContent } from "../components/moment-content";
import { isDocumentEmpty, parseMomentContent } from "../utils/content-parser";
import multilineMoment from "./fixtures/multiline-moment.json";

vi.mock("@heroui/react", () => ({
  Typography: {
    Prose: (props: ComponentProps<"div">) => createElement("div", props),
  },
}));

function render(content: string) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(MomentContent, { content: parseMomentContent(content) })
  );
  return container;
}

describe("Moment native content rendering", () => {
  it("preserves all seven paragraphs and nine hard breaks in the reported moment", () => {
    const container = render(JSON.stringify(multilineMoment));
    expect(container.querySelectorAll("p")).toHaveLength(7);
    expect(container.querySelectorAll("br")).toHaveLength(9);
    expect(container.querySelectorAll("p")[1].innerHTML).toBe(
      "有牵挂，就会有期待；<br>有期待，就难免有评价。"
    );
    expect(container.querySelectorAll("p")[4].querySelectorAll("br")).toHaveLength(3);
    expect(container.querySelectorAll("p")[6].textContent).toBe("就已经很好了。");
    expect(container.querySelector("[contenteditable]")).toBeNull();
  });

  it("renders publisher formatting and block structure without flattening", () => {
    const container = render(
      JSON.stringify({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Title" }] },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Formatted",
                    marks: [
                      { type: "bold" },
                      { type: "italic" },
                      { type: "underline" },
                      { type: "strike" },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }],
              },
            ],
          },
          { type: "codeBlock", content: [{ type: "text", text: "one\ntwo" }] },
          { type: "horizontalRule" },
        ],
      })
    );
    expect(container.querySelector("h2")?.textContent).toBe("Title");
    for (const tag of ["strong", "em", "u", "s"]) {
      expect(container.querySelector(`blockquote ${tag}`)?.textContent).toBe("Formatted");
    }
    expect(container.querySelector("ul li p")?.textContent).toBe("Item");
    expect(container.querySelector("pre code")?.textContent).toBe("one\ntwo");
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("escapes literal markup and neutralizes unsafe links while keeping safe links", () => {
    const container = render(
      JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "<script>alert(1)</script>",
                marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
              },
              {
                type: "text",
                text: "Safe",
                marks: [{ type: "link", attrs: { href: "https://example.com", target: "_blank" } }],
              },
            ],
          },
        ],
      })
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("");
    const safeLink = container.querySelector('a[href="https://example.com"]');
    expect(safeLink).not.toBeNull();
    expect(safeLink?.getAttribute("rel")).toContain("noopener");
  });

  it("preserves legacy newlines and empty interior paragraphs", () => {
    expect(render("First\nSecond\n\nThird").querySelector("p")?.textContent).toBe(
      "First\nSecond\n\nThird"
    );
    const container = render(
      JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Before" }] },
          { type: "paragraph" },
          { type: "paragraph", content: [{ type: "text", text: "After" }] },
        ],
      })
    );
    expect(container.querySelectorAll("p")).toHaveLength(3);
    expect(container.querySelectorAll("p")[1].textContent).toBe("");
  });

  it("omits empty notes but keeps visible non-text nodes", () => {
    for (const content of [
      "",
      "  ",
      '{"type":"doc","content":[]}',
      JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "hardBreak" }] }],
      }),
    ]) {
      expect(render(content).innerHTML).toBe("");
    }
    const rule = { type: "doc", content: [{ type: "horizontalRule" }] };
    expect(isDocumentEmpty(rule)).toBe(false);
    expect(render(JSON.stringify(rule)).querySelector("hr")).not.toBeNull();
  });

  it("keeps unsupported or malformed documents from crashing the feed", () => {
    for (const content of [
      "{broken",
      '{"type":"doc","content":[{"type":"unknown"}]}',
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":""}]}]}',
    ]) {
      expect(render(content).querySelector("p")?.textContent).toBe(content);
    }
  });
});
