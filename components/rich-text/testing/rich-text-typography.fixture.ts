import type { JSONContent } from "@tiptap/core";
import { RICH_TEXT_DOCUMENT_FIXTURE } from "./rich-text-document.fixture";

const paragraph = (text: string): JSONContent => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

/** All persisted blocks, plus combinations that expose spacing and overflow bugs. */
export const RICH_TEXT_TYPOGRAPHY_FIXTURE: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Reading typography" }],
    },
    paragraph(
      "中文阅读与 English typography 应当保持一致的节奏。段落用自然换行组织内容，标题表达层级，留白帮助读者区分主题。"
    ),
    paragraph(
      "A second paragraph keeps a steady reading rhythm. Inline formatting should remain legible without changing the surrounding line height."
    ),
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Section heading" }] },
    paragraph(
      "Headings have more space before them than after them, so each heading stays visually connected to the content it introduces."
    ),
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Subsection heading" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Inline marks: " },
        { type: "text", text: "strong", marks: [{ type: "bold" }] },
        { type: "text", text: ", " },
        { type: "text", text: "emphasis", marks: [{ type: "italic" }] },
        { type: "text", text: ", " },
        { type: "text", text: "inlineCode()", marks: [{ type: "code" }] },
        { type: "text", text: ", " },
        {
          type: "text",
          text: "highlight",
          marks: [{ type: "textStyle", attrs: { backgroundColor: "#fde047" } }],
        },
        { type: "text", text: ", " },
        { type: "text", text: "underline", marks: [{ type: "underline" }] },
        { type: "text", text: ", " },
        { type: "text", text: "deleted", marks: [{ type: "strike" }] },
        { type: "text", text: ", x" },
        { type: "text", text: "2", marks: [{ type: "superscript" }] },
        { type: "text", text: ", H" },
        { type: "text", text: "2", marks: [{ type: "subscript" }] },
        { type: "text", text: "O. " },
        { type: "inlineMath", attrs: { latex: "E = mc^2" } },
        { type: "text", text: " " },
        { type: "emoji", attrs: { name: "grinning" } },
        { type: "text", text: " " },
        { type: "mention", attrs: { id: "typography", label: "Typography" } },
        { type: "hardBreak" },
        { type: "text", text: "A deliberate line break stays inside the paragraph." },
      ],
    },
    ...RICH_TEXT_DOCUMENT_FIXTURE.content!,
    {
      type: "orderedList",
      attrs: { start: 3 },
      content: [
        {
          type: "listItem",
          content: [
            paragraph("A numbered item with two paragraphs."),
            paragraph("The second paragraph belongs to the same item."),
          ],
        },
        { type: "listItem", content: [paragraph("The next item preserves its numbering.")] },
      ],
    },
    {
      type: "codeBlock",
      attrs: { language: "typescript" },
      content: [
        {
          type: "text",
          text: `const longLine = "${"readable code ".repeat(28)}";\nconsole.log(longLine);`,
        },
      ],
    },
    paragraph(
      `Long links wrap within the reading column: https://example.com/${"continuous-path".repeat(20)}`
    ),
    {
      type: "paragraph",
      attrs: { textAlign: "center" },
      content: [
        {
          type: "text",
          text: "An explicit author format remains intact.",
          marks: [
            {
              type: "textStyle",
              attrs: {
                fontSize: "20px",
                color: "#c026d3",
                fontFamily: "monospace",
                lineHeight: "2",
              },
            },
          ],
        },
      ],
    },
    paragraph("End of typography specimen."),
  ],
};
