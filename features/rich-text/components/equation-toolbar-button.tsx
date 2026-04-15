"use client";

import { insertInlineEquation } from "@platejs/math";
import { useEditorRef } from "platejs/react";
import type * as React from "react";

import { ToolbarButton } from "./toolbar-kit";

export function InlineEquationToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onPress={() => {
        insertInlineEquation(editor);
      }}
      tooltip="Mark as equation"
    >
      {props.children}
    </ToolbarButton>
  );
}
