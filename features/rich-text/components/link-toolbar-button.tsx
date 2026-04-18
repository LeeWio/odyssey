"use client";

import { useLinkToolbarButton, useLinkToolbarButtonState } from "@platejs/link/react";

import { ToolbarButton } from "./toolbar-kit";

export function LinkToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarButton
      {...props}
      isSelected={buttonProps.pressed}
      onPress={buttonProps.onClick}
      onMouseDown={buttonProps.onMouseDown}
    >
      {props.children}
    </ToolbarButton>
  );
}
