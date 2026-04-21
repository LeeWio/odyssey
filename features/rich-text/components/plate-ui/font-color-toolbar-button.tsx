"use client";

import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorPickerPopoverProps,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  parseColor,
  ColorValue,
  ButtonGroup,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useCallback, useMemo } from "react";
import { useEditorRef, useEditorSelector } from "platejs/react";
import { ToolbarButton } from "../toolbar-kit";

export function FontColorToolbarButton({
  children,
  nodeType,
  tooltip,
}: {
  nodeType: string;
  tooltip?: string;
} & ColorPickerPopoverProps) {
  const editor = useEditorRef();

  const markColor = useEditorSelector((editor) => editor.api.mark(nodeType) as string, [nodeType]);

  const color = useMemo(() => {
    if (!markColor) return parseColor("#325578");

    try {
      return parseColor(markColor);
    } catch (err) {
      console.warn("Color parse error:", err);
      return parseColor("#325578");
    }
  }, [markColor]);

  const handleColorChange = useCallback(
    (newColor: ColorValue) => {
      const colorString = newColor.toString("hex");

      if (editor.selection) {
        editor.tf.select(editor.selection);
        editor.tf.addMarks({ [nodeType]: colorString });
        editor.tf.focus();
      }
    },
    [editor, nodeType],
  );

  const clearColor = useCallback(() => {
    if (editor.selection) {
      editor.tf.select(editor.selection);
      editor.tf.removeMarks(nodeType);
      editor.tf.focus();
    }
  }, [editor, nodeType]);

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
    const randomSaturation = 50 + Math.floor(Math.random() * 50);
    const randomLightness = 40 + Math.floor(Math.random() * 30);
    const newColor = parseColor(`hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`);
    handleColorChange(newColor);
  };

  return (
    <div className="flex flex-col gap-4">
      <ColorPicker value={color} onChange={handleColorChange}>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
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
            <ButtonGroup variant="tertiary" size="sm">
              <Button
                size="sm"
                isIconOnly
                variant="tertiary"
                aria-label="Shuffle color"
                onPress={shuffleColor}
              >
                <Icon className="size-4" icon="gravity-ui:shuffle" />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label="Clear color"
                isDisabled={!markColor}
                onPress={clearColor}
              >
                <ButtonGroup.Separator />
                <Icon icon="lucide:eraser" className="size-4" />
              </Button>
            </ButtonGroup>
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
    </div>
  );
}
