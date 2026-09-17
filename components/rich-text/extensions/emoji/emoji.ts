import TiptapEmoji from "@tiptap/extension-emoji";
import { renderEmojiSuggestion } from "./emoji-suggestion";

/** Editable emoji extension with inline suggestion picker. */
export const Emoji = TiptapEmoji.configure({
  enableEmoticons: false,
  forceFallbackImages: false,
  suggestion: {
    dismissOnOutsideClick: false,
    offset: { mainAxis: 8, crossAxis: 0 },
    render: renderEmojiSuggestion,
  },
});
