"use client";

import { NumberStepper } from "@heroui-pro/react";
import type { ComponentProps } from "react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  format?: ComponentProps<typeof NumberStepper>["formatOptions"];
}

export function AnimatedNumber({ value, className, format }: AnimatedNumberProps) {
  return (
    <NumberStepper value={value} isDisabled formatOptions={format}>
      <NumberStepper.Value className={className} />
    </NumberStepper>
  );
}
