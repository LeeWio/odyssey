"use client";

import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { Dropdown, Button, Tooltip } from "@heroui/react";

export function FixedToolbar() {
  const { editor } = useRichTextEditor();

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

        <Dropdown>
          <Tooltip delay={0}>
            <Button aria-label="Multi-column Layout" isIconOnly size="sm" variant="ghost">
              <Icon icon="lucide:columns" className="h-4 w-4" />
            </Button>
            <Tooltip.Content>Multi-column Layout</Tooltip.Content>
          </Tooltip>
          <Dropdown.Popover>
            <Dropdown.Menu>
              <Dropdown.Item
                id="cols-2"
                textValue="2 Columns"
                onAction={() => editor?.chain().focus().setColumns(2).run()}
              >
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:columns-2" className="h-4 w-4" aria-hidden="true" />
                  <span>2 Columns</span>
                </div>
              </Dropdown.Item>
              <Dropdown.Item
                id="cols-3"
                textValue="3 Columns"
                onAction={() => editor?.chain().focus().setColumns(3).run()}
              >
                <div className="flex items-center gap-2">
                  <Icon icon="lucide:columns-3" className="h-4 w-4" aria-hidden="true" />
                  <span>3 Columns</span>
                </div>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  );
}
