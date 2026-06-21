import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { LinkMenuEdit } from "../link-menu/link-menu-edit";
import {
  Button,
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

export function TextMenu() {
  const states = useTextMenuStates();
  const commands = useRichTextCommands();

  const state = useOverlayState();

  const moreOverlayState = useOverlayState();

  const handleCloseAndRun = (fn: () => void) => () => {
    moreOverlayState.close();
    fn();
  };

  return (
    <RichTextEditor.BubbleMenu pluginKey="text-menu" shouldShow={states.shouldShow}>
      <Dropdown>
        <Button aria-label="" variant="secondary" isIconOnly>
          A
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
            <Dropdown.Item id="new-file" textValue="New file">
              <Label>New file</Label>
            </Dropdown.Item>
            <Dropdown.Item id="copy-link" textValue="Copy link">
              <Label>Copy link</Label>
            </Dropdown.Item>
            <Dropdown.Item id="edit-file" textValue="Edit file">
              <Label>Edit file</Label>
            </Dropdown.Item>
            <Dropdown.Item id="delete-file" textValue="Delete file" variant="danger">
              <Label>Delete file</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
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
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(commands.onSubscript)}
                isSelected={states.isSubscript}
              >
                <Icon icon="gravity-ui:superscript" />
              </ToggleButton>
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(commands.onSuperscript)}
                isSelected={states.isSuperscript}
              >
                <Icon icon="gravity-ui:superscript" />
              </ToggleButton>
              <RichTextEditor.ToolbarSeparator />
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(commands.onAlignLeft)}
                isSelected={states.isAlignLeft}
              >
                <Icon icon="gravity-ui:text-align-left" />
              </ToggleButton>
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(handleCloseAndRun(commands.onAlignCenter))}
                isSelected={states.isAlignCenter}
              >
                <Icon icon="gravity-ui:text-align-center" />
              </ToggleButton>
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(commands.onAlignRight)}
                isSelected={states.isAlignRight}
              >
                <Icon icon="gravity-ui:text-align-right" />
              </ToggleButton>
              <ToggleButton
                size="sm"
                isIconOnly
                variant="ghost"
                onPress={handleCloseAndRun(commands.onAlignJustify)}
                isSelected={states.isAlignJustify}
              >
                <Icon icon="gravity-ui:text-align-justify" />
              </ToggleButton>
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
