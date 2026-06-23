"use client";

import { memo } from "react";
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

interface TextColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const TextColorPicker = memo(function TextColorPicker({
  value,
  onChange,
}: TextColorPickerProps) {
  const color = parseColor(value || "#000000");

  const colorPresets = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
  ];

  const shuffleColor = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomSaturation = 50 + Math.floor(Math.random() * 50); // 50-100%
    const randomLightness = 40 + Math.floor(Math.random() * 30); // 40-70%

    onChange(
      parseColor(`hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`).toString("hex")
    );
  };

  return (
    <ColorPicker value={color} onChange={(newColor) => onChange(newColor.toString("hex"))}>
      <ColorPicker.Trigger>
        <ColorSwatch size="sm" />
      </ColorPicker.Trigger>

      <ColorPicker.Popover className="gap-2">
        <ColorSwatchPicker className="justify-center pt-2" size="xs">
          {colorPresets.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset}>
              <ColorSwatchPicker.Swatch />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        <ColorArea
          aria-label="Color area"
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <div className="flex items-center gap-2 px-1">
          <ColorSlider aria-label="Hue slider" channel="hue" className="flex-1" colorSpace="hsb">
            <ColorSlider.Track>
              <ColorSlider.Thumb />
            </ColorSlider.Track>
          </ColorSlider>
          <Button
            isIconOnly
            aria-label="Shuffle color"
            size="sm"
            variant="tertiary"
            onPress={shuffleColor}
          >
            <Icon className="size-4" icon="gravity-ui:shuffle" />
          </Button>
        </div>
        <ColorField aria-label="Color field">
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

TextColorPicker.displayName = "TextColorPicker";
