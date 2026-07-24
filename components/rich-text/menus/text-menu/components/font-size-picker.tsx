"use client";

import { NumberStepper } from "@heroui-pro/react";
import { memo } from "react";

interface FontSizePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const FontSizePicker = memo(function FontSizePicker({
  value,
  onChange,
}: FontSizePickerProps) {
  const isDefault = value === "";
  const numericValue = isDefault ? 16 : parseInt(value, 10) || 16;

  const handleStepChange = (newValue: number) => {
    onChange(`${newValue}px`);
  };

  return (
    <NumberStepper
      aria-label="Font size"
      value={numericValue}
      onChange={handleStepChange}
      minValue={8}
      maxValue={96}
      size="sm"
    >
      <NumberStepper.Group className="bg-transparent">
        <NumberStepper.DecrementButton />
        <NumberStepper.Value />
        <NumberStepper.IncrementButton />
      </NumberStepper.Group>
    </NumberStepper>
  );
});

FontSizePicker.displayName = "FontSizePicker";
