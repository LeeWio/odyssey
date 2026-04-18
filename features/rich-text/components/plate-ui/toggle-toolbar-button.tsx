"use client";

import React from "react";
import { useToggleToolbarButton, useToggleToolbarButtonState } from "@platejs/toggle/react";
import { ToolbarToggle } from "../primitives/toolbar-toggle";

export function ToggleToolbarButton({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<typeof ToolbarToggle>) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarToggle
      isSelected={buttonProps.pressed}
      onPress={buttonProps.onClick}
      tooltip="Toggle"
      {...props}
    >
      {children}
    </ToolbarToggle>
  );
}
