"use client";

import type { PlateElementProps } from "platejs/react";
import { PlateElement, useFocused, useReadOnly, useSelected } from "platejs/react";

import { cn } from "@heroui/styles";
import { Separator } from "@heroui/react";

export function HrElement(props: PlateElementProps) {
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();

  return (
    <PlateElement {...props}>
      <hr
        contentEditable={false}
        className={cn(
          "separator separator--horizontal my-6",
          selected && focused ? "separator--tertiary" : "separator--default",
          !readOnly && "cursor-pointer",
        )}
      />
      {props.children}
    </PlateElement>
  );
}
