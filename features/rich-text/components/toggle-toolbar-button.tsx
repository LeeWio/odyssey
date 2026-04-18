"use client";

import * as React from "react";

import { useToggleToolbarButton, useToggleToolbarButtonState } from "@platejs/toggle/react";

import { ToolbarButton } from "./toolbar-kit";

export function ToggleToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarButton
      onPress={buttonProps.onClick}
      isSelected={buttonProps.pressed}
      onMouseDown={buttonProps.onMouseDown}
      {...props}
      tooltip="Toggle"
    >
      {props.children}
    </ToolbarButton>
  );
}
