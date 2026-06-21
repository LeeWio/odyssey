import { RichTextEditor, useRichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { LinkMenuEdit } from "../link-menu/link-menu-edit";
import { useOverlayState } from "@heroui/react";
import { useTextMenuStates } from "./hooks/use-text-menu-states";

export function TextMenu() {
  const { editor } = useRichTextEditor();

  const states = useTextMenuStates(editor);

  const state = useOverlayState();

  return (
    <RichTextEditor.BubbleMenu pluginKey="text-menu" shouldShow={states.shouldShow}>
      <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
        <Icon icon="gravity-ui:bold" />
      </RichTextEditor.ToggleButton>

      <RichTextEditor.LinkPopover isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <RichTextEditor.LinkPopover.Trigger isIconOnly>
          <Icon icon="gravity-ui:link" />
        </RichTextEditor.LinkPopover.Trigger>
        <RichTextEditor.LinkPopover.Content>
          <LinkMenuEdit onCancel={state.close} />
        </RichTextEditor.LinkPopover.Content>
      </RichTextEditor.LinkPopover>
    </RichTextEditor.BubbleMenu>
  );
}
