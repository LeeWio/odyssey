import { Editor } from "@tiptap/react";
import { Link, HorizontalRule } from "../extensions";

export const isTableGripSelected = (node: HTMLElement | null) => {
  let container: HTMLElement | null = node;

  while (container && !["TD", "TH"].includes(container.tagName)) {
    container = container.parentElement;
  }

  const gripColumn = container?.querySelector && container.querySelector("a.grip-column.selected");
  const gripRow = container?.querySelector && container.querySelector("a.grip-row.selected");

  return !!(gripColumn || gripRow);
};

export const isCustomNodeSelected = (editor: Editor, node: HTMLElement | null) => {
  const customNodes = [Link.name, HorizontalRule.name];

  const isActive = customNodes.some((type) => editor.isActive(type));

  return isActive || isTableGripSelected(node);
};
