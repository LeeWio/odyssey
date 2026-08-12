"use client";

import { useOverlayState } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import { Icon } from "@iconify/react";
import { LinkMenuEdit } from "../menus/link-menu/link-menu-edit";

export function LinkPopover() {
  const state = useOverlayState();

  return (
    <RichTextEditor.LinkPopover isOpen={state.isOpen} onOpenChange={state.setOpen}>
      <RichTextEditor.LinkPopover.Trigger isIconOnly tooltip="Link">
        <Icon aria-hidden="true" icon="gravity-ui:link" />
      </RichTextEditor.LinkPopover.Trigger>
      <RichTextEditor.LinkPopover.Content>
        <LinkMenuEdit onCancel={state.close} />
      </RichTextEditor.LinkPopover.Content>
    </RichTextEditor.LinkPopover>
  );
}
