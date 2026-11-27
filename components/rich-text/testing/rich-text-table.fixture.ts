import type { JSONContent } from "@tiptap/core";

export const RICH_TEXT_TABLE_FIXTURE: JSONContent = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Team" }] },
    {
      type: "table",
      content: [
        ["Name", "Role", "Department", "Location"],
        ["Amy", "Senior Developer", "Engineering", "San Francisco"],
        ["Bo", "Product Manager", "Product", "New York"],
        ["Cy", "UX Designer", "Design", "London"],
        ["Dan", "Data Analyst", "Analytics", "Remote"],
      ].map((row, index) => ({
        type: "tableRow",
        content: row.map((text) => ({
          type: index === 0 ? "tableHeader" : "tableCell",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })),
      })),
    },
    { type: "paragraph", content: [{ type: "text", text: "After the table" }] },
  ],
};
