"use client";

import { Button, Popover, Tooltip } from "@heroui/react";
import { useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { emojiToShortcode } from "@tiptap/extension-emoji";
import type { Editor } from "@tiptap/react";
import { useState } from "react";

import { InlineEmojiPicker } from "../extensions/emoji/emoji-picker";

function insertEmoji(editor: Editor, unicode: string) {
  const shortcode = emojiToShortcode(unicode, editor.storage.emoji.emojis);

  if (shortcode) {
    return editor.chain().focus().setEmoji(shortcode).run();
  }

  return editor.chain().focus().insertContent(unicode).run();
}

export function EmojiToolbarPicker() {
  const { editor, isDisabled, isReadOnly } = useRichTextEditor();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (unicode: string) => {
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      if (editor) insertEmoji(editor, unicode);
    });
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Tooltip delay={0}>
        <Button
          isIconOnly
          aria-label="Insert emoji"
          isDisabled={!editor || isDisabled || isReadOnly}
          size="sm"
          variant="ghost"
        >
          <Icon aria-hidden="true" icon="gravity-ui:face-smile" />
        </Button>
        <Tooltip.Content>Insert emoji</Tooltip.Content>
      </Tooltip>

      <Popover.Content
        isNonModal
        className="overflow-visible bg-transparent p-0 shadow-none"
        placement="bottom start"
      >
        <Popover.Dialog className="p-0 outline-none">
          <InlineEmojiPicker onSelect={handleSelect} />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
