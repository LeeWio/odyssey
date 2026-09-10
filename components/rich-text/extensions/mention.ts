import { Mention as TiptapMention } from "@tiptap/extension-mention";

/**
 * HeroUI Pro RichTextEditor.SuggestionMenu owns the @ suggestion plugin.
 * Keep Mention focused on the inline node schema and serialization so the
 * editor does not register two competing suggestion plugins.
 */
export const Mention = TiptapMention.extend({
  addProseMirrorPlugins() {
    return [];
  },
}).configure({
  HTMLAttributes: {
    class: "text-accent font-medium",
    "data-type": "mention",
  },
});
