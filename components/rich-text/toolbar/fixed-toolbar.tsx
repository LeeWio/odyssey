"use client";

import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { MultiColumnMenu } from "./multi-column-menu";
import { TableSelector } from "./table-selector";

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
        <RichTextEditor.ToggleButton command="heading-1" tooltip="Heading 1">
          <Icon icon="gravity-ui:heading-1" />
        </RichTextEditor.ToggleButton>
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

        <RichTextEditor.CommandButton
          aria-label="Toggle details block"
          tooltip="Details"
          isActive={(currentEditor) => currentEditor.isActive("details")}
          isDisabled={(currentEditor) => {
            const chain = currentEditor.can().chain().focus();

            return currentEditor.isActive("details")
              ? !chain.unsetDetails().run()
              : !chain.setDetails().run();
          }}
          onCommand={(currentEditor) =>
            currentEditor.isActive("details")
              ? currentEditor.chain().focus().unsetDetails().run()
              : currentEditor
                  .chain()
                  .focus()
                  .setDetails()
                  .updateAttributes("details", { open: true })
                  .run()
          }
        >
          <Icon icon="gravity-ui:circle-chevron-down" />
        </RichTextEditor.CommandButton>

        <RichTextEditor.CommandButton
          aria-label="Insert image"
          tooltip="Insert image"
          isDisabled={(currentEditor) =>
            !currentEditor.can().chain().insertContent({ type: "image" }).run()
          }
          onCommand={(currentEditor) =>
            currentEditor.chain().focus().insertContent({ type: "image" }).run()
          }
        >
          <Icon icon="gravity-ui:picture" />
        </RichTextEditor.CommandButton>

        <TableSelector
          onSelect={(rows, cols) => {
            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
          }}
        />

        <MultiColumnMenu />
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  );
}
