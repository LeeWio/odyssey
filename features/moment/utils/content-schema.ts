import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

// Match the content extensions in HeroUI Pro RichTextEditor used by the publisher.
export const momentContentExtensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false } }),
];

export const momentContentSchema = getSchema(momentContentExtensions);
