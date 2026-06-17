import { RichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";

export function BubbleToolbar() {
  return (
    <RichTextEditor.BubbleMenu>
      <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
        <Icon icon="gravity-ui:bold" />
      </RichTextEditor.ToggleButton>
    </RichTextEditor.BubbleMenu>
  );
}
