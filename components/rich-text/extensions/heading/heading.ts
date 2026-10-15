import { mergeAttributes } from "@tiptap/core";
import TiptapHeading, { type Level } from "@tiptap/extension-heading";

export const HEADING_LEVELS = [1, 2, 3] as const satisfies readonly Level[];

export type HeadingLevel = (typeof HEADING_LEVELS)[number];

/** Levels outside the supported range render and persist as the first level. */
export function clampHeadingLevel(level: number): HeadingLevel {
  return HEADING_LEVELS.includes(level as HeadingLevel)
    ? (level as HeadingLevel)
    : HEADING_LEVELS[0];
}

/**
 * Shared heading node for the editor and the reader.
 * Visual rhythm comes from the surrounding Typography.Prose container.
 */
export const Heading = TiptapHeading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = clampHeadingLevel(Number(node.attrs.level));

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
}).configure({ levels: [...HEADING_LEVELS] });

export default Heading;
