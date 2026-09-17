"use client";

import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  parseColor,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { memo } from "react";

interface BgColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COLOR_PRESETS = [
  "#fef08a",
  "#bbf7d0",
  "#a5f3fc",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
  "#fecdd3",
  "#e5e7eb",
  "#ffffff",
] as const;

/**
 * Background highlight color picker — same HeroUI ColorPicker anatomy as text color.
 */
export const BgColorPicker = memo(function BgColorPicker({ value, onChange }: BgColorPickerProps) {
  const color = parseColor(value || "#ffffff");

  return (
    <ColorPicker value={color} onChange={(next) => onChange(next.toString("hex"))}>
      <Button isIconOnly size="sm" variant="tertiary" aria-label="Background color">
        <Icon icon="gravity-ui:palette" style={{ color: value || undefined }} />
      </Button>
      <ColorPicker.Popover className="gap-2">
        <ColorSwatchPicker
          aria-label="Background color presets"
          className="justify-center pt-2"
          size="xs"
        >
          {COLOR_PRESETS.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset}>
              <ColorSwatchPicker.Swatch />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        <ColorArea
          aria-label="Background color area"
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider aria-label="Hue slider" channel="hue" className="px-1" colorSpace="hsb">
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorField aria-label="Background color field">
          <ColorField.Group variant="secondary">
            <ColorField.Prefix>
              <ColorSwatch size="xs" />
            </ColorField.Prefix>
            <ColorField.Input />
          </ColorField.Group>
        </ColorField>
      </ColorPicker.Popover>
    </ColorPicker>
  );
});

BgColorPicker.displayName = "BgColorPicker";
