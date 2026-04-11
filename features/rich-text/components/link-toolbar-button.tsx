"use client";

import { useLinkToolbarButton, useLinkToolbarButtonState } from "@platejs/link/react";
import { Link } from "@gravity-ui/icons";

import { ToolbarButton } from "./toolbar-kit";

export function LinkToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarButton
      {...props}
      isSelected={buttonProps.pressed}
      onPress={buttonProps.onClick}
      onMouseDown={buttonProps.onMouseDown as any}
    >
      {props.children}
    </ToolbarButton>
  );
}
