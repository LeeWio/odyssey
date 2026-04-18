"use client";

import React from "react";
import { useMarkToolbarButton, useMarkToolbarButtonState } from "platejs/react";
import { ToolbarToggle } from "../primitives/toolbar-toggle";

export interface MarkToolbarButtonProps {
  nodeType: string;
  clear?: string[] | string;
  tooltip?: string;
  icon: React.ReactNode;
}

/**
 * A Plate-aware toolbar button for marks (bold, italic, etc.)
 */
export function MarkToolbarButton({
  nodeType,
  clear,
  tooltip,
  icon,
  ...props
}: MarkToolbarButtonProps) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: plateProps } = useMarkToolbarButton(state);

  return (
    <ToolbarToggle
      tooltip={tooltip}
      isSelected={plateProps.pressed}
      onPress={plateProps.onClick}
      {...props}
    >
      {icon}
    </ToolbarToggle>
  );
}
