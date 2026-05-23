"use client";

import { NumberStepper } from "@heroui-pro/react";
import type { NumberFormatOptions } from "@internationalized/number";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  format?: NumberFormatOptions;
}

export function AnimatedNumber({
  value,
  className,
  format,
}: AnimatedNumberProps) {
  return (
    <NumberStepper 
      value={value} 
      isDisabled 
      className="bg-transparent border-none p-0 shadow-none min-w-0"
      formatOptions={format}
    >
      <NumberStepper.Group className="bg-transparent border-none p-0 shadow-none gap-0">
        <NumberStepper.Value className={className} />
      </NumberStepper.Group>
    </NumberStepper>
  );
}
