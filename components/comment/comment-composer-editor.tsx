"use client";

import { Bold, Italic, Link as LinkIcon, ListUl } from "@gravity-ui/icons";
import { RichTextEditor } from "@heroui-pro/react/rich-text-editor";
import type { JSONContent } from "@tiptap/core";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { COMMENT_MAX_LENGTH, emptyCommentDocument } from "./comment-document";

interface CommentComposerEditorProps {
  defaultValue?: JSONContent;
  isReadOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  resetKey?: string;
  signature?: React.ReactNode;
  onDocumentChange?: (document: JSONContent, isEmpty: boolean) => void;
}

export function CommentComposerEditor({
  defaultValue = emptyCommentDocument(),
  isReadOnly = false,
  maxLength = COMMENT_MAX_LENGTH,
  placeholder,
  resetKey = "composer",
  signature,
  onDocumentChange,
}: CommentComposerEditorProps) {
  const t = useTranslations("Comments");
  const [value, setValue] = useState<JSONContent>(defaultValue);

  return (
    <RichTextEditor
      key={resetKey}
      className="w-full"
      isReadOnly={isReadOnly}
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      variant="secondary"
      onValueChange={(nextValue, details) => {
        setValue(nextValue);
        onDocumentChange?.(nextValue, details.isEmpty);
      }}
    >
      <RichTextEditor.Shell className="border-0 bg-transparent shadow-none">
        <RichTextEditor.Content />
        {isReadOnly ? null : (
          <RichTextEditor.Footer>
            {signature}
            <RichTextEditor.Toolbar
              aria-label={t("editorToolbar")}
              className="min-h-0 border-0 p-0"
            >
              <RichTextEditor.ToolbarGroup>
                <RichTextEditor.ToggleButton command="bold" tooltip={t("bold")}>
                  <Bold className="size-4" />
                </RichTextEditor.ToggleButton>
                <RichTextEditor.ToggleButton command="italic" tooltip={t("italic")}>
                  <Italic className="size-4" />
                </RichTextEditor.ToggleButton>
                <RichTextEditor.ToggleButton command="bulletList" tooltip={t("bulletedList")}>
                  <ListUl className="size-4" />
                </RichTextEditor.ToggleButton>
                <RichTextEditor.LinkPopover>
                  <RichTextEditor.LinkPopover.Trigger tooltip={t("link")}>
                    <LinkIcon className="size-4" />
                  </RichTextEditor.LinkPopover.Trigger>
                  <RichTextEditor.LinkPopover.Content>
                    <RichTextEditor.LinkPopover.Input />
                    <RichTextEditor.LinkPopover.Actions>
                      <RichTextEditor.LinkPopover.UnsetButton />
                      <RichTextEditor.LinkPopover.ApplyButton />
                    </RichTextEditor.LinkPopover.Actions>
                  </RichTextEditor.LinkPopover.Content>
                </RichTextEditor.LinkPopover>
              </RichTextEditor.ToolbarGroup>
            </RichTextEditor.Toolbar>
            <RichTextEditor.CharacterCount />
          </RichTextEditor.Footer>
        )}
      </RichTextEditor.Shell>
    </RichTextEditor>
  );
}
