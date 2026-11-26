import { BroomMotion } from "@gravity-ui/icons";
import { Button, Tooltip } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react/rich-text-editor";
import { Icon } from "@iconify/react";
import { BlockTypeSelector } from "../../toolbar/block-type-selector";
import { LinkPopover } from "../../toolbar/link-popover";
import { BubbleMenu } from "../bubble-menu";
import { ColorFormattingPopover } from "./components/color-formatting-popover";
import { MoreFormattingMenu } from "./components/more-formatting-menu";
import { TypographyPopover } from "./components/typography-popover";
import { useRichTextCommands } from "./hooks/use-rich-text-commands";
import { useTextMenuStates } from "./hooks/use-text-menu-states";

const bubblePosition = { shift: { padding: 6 } };
const toolbarGroupClassName = "shrink-0 max-[380px]:gap-0";
const toolbarDividerClassName = "max-[600px]:hidden";

export function TextMenu() {
  const states = useTextMenuStates();
  const commands = useRichTextCommands();

  return (
    <BubbleMenu
      pluginKey="text-menu"
      shouldShow={states.shouldShow}
      options={bubblePosition}
      toolbarProps={{
        // The bubble provides the Glass backdrop for its ghost toggle buttons.
        className:
          "max-w-[calc(100dvw-1.25rem)] max-[600px]:grid! max-[600px]:grid-flow-row max-[600px]:grid-cols-2 max-[600px]:gap-x-2! [&_.toggle-button--ghost]:backdrop-filter-none!",
      }}
    >
      <RichTextEditor.ToolbarGroup
        aria-label="Typography controls"
        className={toolbarGroupClassName}
      >
        <BlockTypeSelector compact />
        <TypographyPopover
          fontFamily={states.fontFamily}
          fontSize={states.fontSize}
          lineHeight={states.lineHeight ?? ""}
          typographyPreset={states.typographyPreset ?? null}
          onFontFamilyChange={commands.setFontFamily}
          onFontSizeChange={commands.setFontSize}
          onLineHeightChange={commands.setLineHeight}
          onPresetChange={commands.applyTypographyPreset}
        />
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator orientation="vertical" className={toolbarDividerClassName} />

      <RichTextEditor.ToolbarGroup aria-label="Inline styles" className={toolbarGroupClassName}>
        <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
          <Icon aria-hidden="true" icon="gravity-ui:bold" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="italic" tooltip="Italic">
          <Icon aria-hidden="true" icon="gravity-ui:italic" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="underline" tooltip="Underline">
          <Icon aria-hidden="true" icon="gravity-ui:underline" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator orientation="vertical" className={toolbarDividerClassName} />

      <RichTextEditor.ToolbarGroup
        aria-label="Additional inline formatting"
        className={toolbarGroupClassName}
      >
        <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough">
          <Icon aria-hidden="true" icon="gravity-ui:strikethrough" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="code" tooltip="Inline code">
          <Icon aria-hidden="true" icon="gravity-ui:code" />
        </RichTextEditor.ToggleButton>
        <Tooltip>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Convert to formula"
            onPress={commands.convertSelectionToInlineMath}
          >
            <Icon aria-hidden="true" icon="gravity-ui:function" />
          </Button>
          <Tooltip.Content>Convert to formula</Tooltip.Content>
        </Tooltip>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator orientation="vertical" className={toolbarDividerClassName} />

      <RichTextEditor.ToolbarGroup
        aria-label="Link, color, and formatting actions"
        className={toolbarGroupClassName}
      >
        <LinkPopover />
        <ColorFormattingPopover
          textColor={states.textColor}
          highlightColor={states.backgroundColor}
          onTextColorChange={commands.setTextColor}
          onHighlightColorChange={commands.setBackgroundColor}
        />
        <RichTextEditor.ActionButton
          action="clearFormatting"
          tooltip="Clear formatting"
          variant="ghost"
        >
          <BroomMotion aria-hidden="true" />
        </RichTextEditor.ActionButton>
        <MoreFormattingMenu states={states} commands={commands} />
      </RichTextEditor.ToolbarGroup>
    </BubbleMenu>
  );
}
