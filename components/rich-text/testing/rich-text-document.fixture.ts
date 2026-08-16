import type { JSONContent } from "@tiptap/react";

/**
 * Representative persisted article used to detect accidental schema drift.
 * Keep this fixture additive as new persisted node or mark types are introduced.
 */
export const RICH_TEXT_DOCUMENT_FIXTURE: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1, textAlign: null, indent: 0 },
      content: [{ type: "text", text: "Odyssey schema fixture" }],
    },
    {
      type: "paragraph",
      attrs: { textAlign: null, indent: 1 },
      content: [
        { type: "text", marks: [{ type: "bold" }], text: "Bold" },
        { type: "text", text: " and " },
        {
          type: "text",
          marks: [
            {
              type: "link",
              attrs: {
                class: null,
                href: "https://example.com/article",
                rel: "noopener noreferrer nofollow",
                target: "_blank",
              },
            },
          ],
          text: "linked text",
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: "List item" }] }],
        },
      ],
    },
    {
      type: "taskList",
      content: [
        {
          type: "taskItem",
          attrs: { checked: true },
          content: [{ type: "paragraph", content: [{ type: "text", text: "Completed task" }] }],
        },
        {
          type: "taskItem",
          attrs: { checked: false },
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Nested task" }] },
            {
              type: "taskList",
              content: [
                {
                  type: "taskItem",
                  attrs: { checked: false },
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Nested child task" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "orderedList",
              attrs: { start: 1, type: null },
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Nested numbered note" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A quotation" }] }],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [{ type: "text", text: "const stable = true;" }],
    },
    { type: "horizontalRule" },
    {
      type: "details",
      attrs: { open: true },
      content: [
        {
          type: "detailsSummary",
          content: [{ type: "text", text: "More context" }],
        },
        {
          type: "detailsContent",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Details body" }] }],
        },
      ],
    },
    {
      type: "columns",
      attrs: { widths: [1, 1] },
      content: [
        {
          type: "column",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Left" }] }],
        },
        {
          type: "column",
          content: [{ type: "paragraph", content: [{ type: "text", text: "Right" }] }],
        },
      ],
    },
    {
      type: "table",
      content: [
        {
          type: "tableRow",
          content: [
            {
              type: "tableHeader",
              attrs: { colspan: 1, colwidth: null, rowspan: 1 },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Column" }] }],
            },
          ],
        },
        {
          type: "tableRow",
          content: [
            {
              type: "tableCell",
              attrs: { colspan: 1, colwidth: null, rowspan: 1 },
              content: [{ type: "paragraph", content: [{ type: "text", text: "Value" }] }],
            },
          ],
        },
      ],
    },
    {
      type: "image",
      attrs: {
        alignment: "center",
        alt: "Schema fixture",
        caption: "A persisted image caption",
        src: "/odyssey-hero.png",
        title: null,
        widthPercent: 100,
      },
    },
    {
      type: "audio",
      attrs: {
        autoplay: false,
        controls: true,
        fileName: "schema-fixture.mp3",
        fileSize: 1024,
        mimeType: "audio/mpeg",
        preload: "metadata",
        src: "https://example.com/schema-fixture.mp3",
      },
    },
    {
      type: "attachment",
      attrs: {
        fileName: "schema-fixture.pdf",
        fileSize: 2048,
        mimeType: "application/pdf",
        src: "https://example.com/schema-fixture.pdf",
      },
    },
    {
      type: "youtube",
      attrs: {
        height: 480,
        src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        start: 0,
        width: 854,
      },
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Euler: " },
        { type: "inlineMath", attrs: { latex: "e^{i\\pi}+1=0" } },
      ],
    },
    { type: "blockMath", attrs: { latex: "\\int_0^1 x^2 dx" } },
  ],
};
