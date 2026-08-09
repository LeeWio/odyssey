"use client";

import {
  EmojiSuggestionPluginKey,
  emojiToShortcode,
  type EmojiItem,
} from "@tiptap/extension-emoji";
import { ReactRenderer } from "@tiptap/react";
import {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef } from "react";

import { InlineEmojiPicker, type InlineEmojiPickerHandle } from "./emoji-picker";

type EmojiSuggestionProps = SuggestionProps<EmojiItem, { name: string }>;

const EmojiSuggestionPicker = forwardRef<InlineEmojiPickerHandle, EmojiSuggestionProps>(
  function EmojiSuggestionPicker(props, ref) {
    const handleDismiss = () => {
      exitSuggestion(props.editor.view, EmojiSuggestionPluginKey);
      window.requestAnimationFrame(() => props.editor.commands.focus());
    };

    const handleSelect = (unicode: string) => {
      const shortcode = emojiToShortcode(unicode, props.editor.storage.emoji.emojis);

      if (shortcode) {
        props.command({ name: shortcode });
        return;
      }

      props.editor.chain().focus().insertContentAt(props.range, `${unicode} `).run();
    };

    return <InlineEmojiPicker ref={ref} onDismiss={handleDismiss} onSelect={handleSelect} />;
  }
);

export function renderEmojiSuggestion() {
  let component: ReactRenderer<InlineEmojiPickerHandle, EmojiSuggestionProps> | null = null;
  let unmount: (() => void) | null = null;

  return {
    onStart(props: EmojiSuggestionProps) {
      component = new ReactRenderer(EmojiSuggestionPicker, {
        editor: props.editor,
        props,
        className: "z-[100]",
      });

      const modalContainer = props.editor.view.dom.closest<HTMLElement>(
        '[data-slot="modal-container"]'
      );

      // Keep the picker inside HeroUI Modal's focus scope. Tiptap otherwise mounts
      // it under document.body, where the modal correctly prevents it from focusing.
      modalContainer?.appendChild(component.element);
      unmount = props.mount(component.element);

      window.requestAnimationFrame(() => component?.ref?.focusSearch());
    },
    onUpdate(props: EmojiSuggestionProps) {
      component?.updateProps(props);
    },
    onKeyDown({ event, view }: SuggestionKeyDownProps) {
      if (event.key !== "Escape") return false;

      window.requestAnimationFrame(() => view.focus());
      return true;
    },
    onExit() {
      unmount?.();
      component?.element.remove();
      component?.destroy();
      unmount = null;
      component = null;
    },
  };
}
