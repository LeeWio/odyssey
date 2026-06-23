import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { LinkMenuEdit } from "../link-menu/link-menu-edit";
import {
  Button,
  ButtonGroup,
  ComboBox,
  Dropdown,
  Input,
  Label,
  ListBox,
  Popover,
  Separator,
  ToggleButton,
  useOverlayState,
} from "@heroui/react";
import { useTextMenuStates } from "./hooks/use-text-menu-states";
import { useRichTextCommands } from "./hooks/use-rich-text-commands";
import { ToggleButtonToolbar } from "../../toolbar/toggle-button-toolbar";
import { FontFamilyPicker } from "./components/font-family-picker";
import { FontSizePicker } from "./components/font-size-picker";
import { LineHeightPicker } from "./components/line-height-picker";
import { TextColorPicker } from "./components/text-color-picker";
import { BgColorPicker } from "./components/bg-color-picker";

export function TextMenu() {
  const { editor } = useRichTextEditor();
  const states = useTextMenuStates();
  const commands = useRichTextCommands();

  const state = useOverlayState();

  const moreOverlayState = useOverlayState();

  return (
    <RichTextEditor.BubbleMenu
      pluginKey="text-menu"
      shouldShow={states.shouldShow}
      appendTo={() =>
        (document.querySelector("[data-slot='modal-dialog']") as HTMLElement) || document.body
      }
    >
      <RichTextEditor.ToolbarGroup aria-label="">
        <FontSizePicker value={states.fontSize} onChange={commands.setFontSize} />
        <FontFamilyPicker value={states.fontFamily} onChange={commands.setFontFamily} />
        <LineHeightPicker value={states.lineHeight} onChange={commands.setLineHeight} />
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

      <RichTextEditor.ToolbarSeparator orientation="vertical" />

      <TextColorPicker value={states.textColor} onChange={commands.setTextColor} />
      <BgColorPicker value={states.backgroundColor} onChange={commands.setBackgroundColor} />

      <RichTextEditor.LinkPopover isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <RichTextEditor.LinkPopover.Trigger isIconOnly>
          <Icon icon="gravity-ui:link" />
        </RichTextEditor.LinkPopover.Trigger>
        <RichTextEditor.LinkPopover.Content>
          <LinkMenuEdit onCancel={state.close} />
        </RichTextEditor.LinkPopover.Content>
      </RichTextEditor.LinkPopover>

      <RichTextEditor.ToolbarSeparator orientation="vertical" />

      <Popover isOpen={moreOverlayState.isOpen} onOpenChange={moreOverlayState.setOpen}>
        <Button isIconOnly size="sm" variant="ghost">
          <Icon icon="gravity-ui:ellipsis-vertical" />
        </Button>
        <Popover.Content>
          <Popover.Dialog className="rounded-2xl p-1">
            <Popover.Arrow />
            <RichTextEditor.ToolbarGroup>
              <ToggleButtonToolbar command="subscript" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:superscript" />
              </ToggleButtonToolbar>

              <ToggleButtonToolbar command="superscript" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:superscript" />
              </ToggleButtonToolbar>

              <RichTextEditor.ToolbarSeparator />

              <ToggleButtonToolbar command="alignLeft" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:text-align-left" />
              </ToggleButtonToolbar>

              <ToggleButtonToolbar command="alignCenter" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:text-align-center" />
              </ToggleButtonToolbar>

              <ToggleButtonToolbar command="alignRight" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:text-align-right" />
              </ToggleButtonToolbar>
              <ToggleButtonToolbar command="alignJustify" onPress={moreOverlayState.close}>
                <Icon icon="gravity-ui:text-align-justify" />
              </ToggleButtonToolbar>

              <RichTextEditor.ToolbarSeparator />

              <RichTextEditor.CommandButton onCommand={() => {}}>
                <Icon icon="gravity-ui:text-outdent" />
              </RichTextEditor.CommandButton>
              <RichTextEditor.CommandButton onCommand={() => {}}>
                <Icon icon="gravity-ui:text-indent" />
              </RichTextEditor.CommandButton>
            </RichTextEditor.ToolbarGroup>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </RichTextEditor.BubbleMenu>
  );
}
