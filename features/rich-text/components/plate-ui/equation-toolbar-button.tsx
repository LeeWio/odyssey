"use client";

import React from "react";
import { insertInlineEquation } from "@platejs/math";
import { useEditorRef } from "platejs/react";
import { ToolbarButton } from "../primitives/toolbar-button";

export function InlineEquationToolbarButton({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onPress={() => {
        insertInlineEquation(editor);
      }}
      tooltip="Insert Equation"
      {...props}
    >
      {children}
    </ToolbarButton>
  );
}
