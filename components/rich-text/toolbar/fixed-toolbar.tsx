"use client";

import { RichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

export function FixedToolbar() {
  return (
    <RichTextEditor.Toolbar>
      <RichTextEditor.ToolbarGroup aria-label="Edit history actions">
        <RichTextEditor.ActionButton aria-label="Undo action" tooltip="Undo" action="undo">
          <Icon icon="gravity-ui:arrow-uturn-ccw-left" />
        </RichTextEditor.ActionButton>
        <RichTextEditor.ActionButton aria-label="Redo action" tooltip="Redo" action="redo">
          <Icon icon="gravity-ui:arrow-uturn-cw-right" />
        </RichTextEditor.ActionButton>
      </RichTextEditor.ToolbarGroup>
      <RichTextEditor.ToolbarSeparator />
      <RichTextEditor.ToolbarGroup aria-label="Text Formatting">
        <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
          <Icon icon="gravity-ui:bold" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="italic" tooltip="Italic">
          <Icon icon="gravity-ui:italic" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="underline" tooltip="Underline">
          <Icon icon="gravity-ui:underline" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="strike" tooltip="Strike">
          <Icon icon="gravity-ui:strikethrough" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="code" tooltip="Code">
          <Icon icon="gravity-ui:code" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarGroup aria-label="Lists and Layout">
        <RichTextEditor.ToggleButton command="bulletList" tooltip="Bullet List">
          <Icon icon="gravity-ui:list-ul" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="orderedList" tooltip="Numbered List">
          <Icon icon="gravity-ui:list-ol" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="blockquote" tooltip="Blockquote">
          <Icon icon="gravity-ui:quote-open" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="codeBlock" tooltip="Code Block">
          <Icon icon="gravity-ui:curly-brackets" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  );
}
