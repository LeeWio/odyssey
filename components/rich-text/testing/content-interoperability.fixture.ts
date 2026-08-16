import type { JSONContent } from "@tiptap/core";

export const COMMON_INTEROPERABILITY_DOCUMENT: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Round-trip fixture" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Bold" },
        { type: "text", text: ", " },
        { type: "text", marks: [{ type: "italic" }], text: "italic" },
        { type: "text", text: ", and " },
        {
          type: "text",
          marks: [{ type: "link", attrs: { href: "https://example.com" } }],
          text: "linked",
        },
        { type: "text", text: " text." },
      ],
    },
    {
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A quotation" }] }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet item" }] }],
        },
      ],
    },
    {
      type: "orderedList",
      attrs: { start: 1 },
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Numbered item" }] }],
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Finished task" }] }],
        },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [{ type: "text", text: "const stable = true;" }],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Column" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              content: [{ type: "paragraph", content: [{ type: "text", text: "Value" }] }],
            },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "https://example.com/fixture.png",
        alt: "Fixture image",
        caption: "A preserved caption",
        alignment: "left",
        widthPercent: 65,
      },
    },
  ],
};

export const COMMON_MARKDOWN_FIXTURE = `## Round-trip fixture

**Bold**, *italic*, and [linked](https://example.com) text.

> A quotation

- Bullet item

1. Numbered item

- [x] Finished task

\`\`\`typescript
const stable = true;
\`\`\`

| Column |
| --- |
| Value |
`;

export const COMMON_HTML_FIXTURE = `
<h2>Round-trip fixture</h2>
<p><strong>Bold</strong>, <em>italic</em>, and <a href="https://example.com">linked</a> text.</p>
<blockquote><p>A quotation</p></blockquote>
<ul><li><p>Bullet item</p></li></ul>
<ol><li><p>Numbered item</p></li></ol>
<pre><code>const stable = true;</code></pre>
<table><tbody><tr><th><p>Column</p></th></tr><tr><td><p>Value</p></td></tr></tbody></table>
`;
