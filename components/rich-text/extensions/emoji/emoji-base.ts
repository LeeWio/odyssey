import TiptapEmoji from "@tiptap/extension-emoji";

/** Schema-compatible emoji node without suggestion UI (safe for read-only). */
export const EmojiBase = TiptapEmoji.configure({
  enableEmoticons: false,
  forceFallbackImages: false,
});
