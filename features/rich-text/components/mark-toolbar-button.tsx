"use client";

import React from "react";
import { useMarkToolbarButton, useMarkToolbarButtonState } from "platejs/react";
import { ToolbarButton } from "./toolbar-button";

export interface MarkToolbarButtonProps extends React.ComponentPropsWithoutRef<
  typeof ToolbarButton
> {
  nodeType: string;
  clear?: string[] | string;
}
