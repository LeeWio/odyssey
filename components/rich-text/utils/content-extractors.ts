import type { JSONContent } from "@tiptap/react";

/**
 * Helper to extract the first heading or paragraph text from Tiptap JSON content as a default Title
 */
export const findFirstHeading = (json: JSONContent): string => {
  if (!json.content) return "";
  for (const node of json.content) {
    if (node.type === "heading" && node.content && node.content[0]?.text) {
      return node.content[0].text;
    }
  }
  for (const node of json.content) {
    if (node.type === "paragraph" && node.content && node.content[0]?.text) {
      return node.content[0].text;
    }
  }
  return "";
};

/**
 * Helper to generate URL slug from title string
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
};

/**
 * Helper to extract full text content from Tiptap JSON
 */
export const extractText = (json: JSONContent): string => {
  if (!json.content) return "";
  let text = "";
  const traverse = (node: JSONContent) => {
    if (node.text) {
      text += `${node.text} `;
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  };
  json.content.forEach(traverse);
  return text.trim();
};
