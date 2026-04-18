"use client";

import React from "react";
import { useLinkToolbarButton, useLinkToolbarButtonState } from "@platejs/link/react";
import { ToolbarToggle } from "../primitives/toolbar-toggle";

export function LinkToolbarButton({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<typeof ToolbarToggle>) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <ToolbarToggle
      isSelected={buttonProps.pressed}
      onPress={buttonProps.onClick}
      tooltip="Insert Link (⌘+K)"
      {...props}
    >
      {children}
    </ToolbarToggle>
  );
}
