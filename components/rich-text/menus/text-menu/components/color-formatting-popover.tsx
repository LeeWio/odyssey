import {
  Button,
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
  ListBox,
  Popover,
  Select,
  Tooltip,
  parseColor,
  type ColorChannel,
  type ColorSpace,
} from "@heroui/react";
import { Segment } from "@heroui-pro/react/segment";
import { Icon } from "@iconify/react";
import { useState } from "react";

const textPresets = [
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

const highlightPresets = [
  "#fef08a",
  "#bbf7d0",
  "#a5f3fc",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
  "#fecdd3",
  "#e5e7eb",
  "#ffffff",
];

const colorChannels: Record<ColorSpace, ColorChannel[]> = {
  hsl: ["hue", "saturation", "lightness"],
  hsb: ["hue", "saturation", "brightness"],
  rgb: ["red", "green", "blue"],
};

function HighlightColorFields() {
  const [space, setSpace] = useState<ColorSpace>("hsl");

  return (
    <>
      <ColorSlider channel="hue" colorSpace="hsb" className="w-full">
        <Label>Hue</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
      <Select
        aria-label="Highlight color space"
        fullWidth
        value={space}
        variant="secondary"
        onChange={(value) => {
          if (value === "hsl" || value === "hsb" || value === "rgb") setSpace(value);
        }}
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {Object.keys(colorChannels).map((space) => (
              <ListBox.Item key={space} id={space} textValue={space.toUpperCase()}>
                {space.toUpperCase()}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <div className="grid w-full grid-cols-3 gap-2">
        {colorChannels[space].map((channel) => (
          <ColorField
            key={channel}
            aria-label={channel}
            channel={channel}
            colorSpace={space}
            fullWidth
          >
            <ColorField.Group variant="secondary">
              <ColorField.Input className="min-w-0 tabular-nums" />
            </ColorField.Group>
          </ColorField>
        ))}
      </div>
    </>
  );
}

export function ColorFormattingPopover({
  textColor,
  highlightColor,
  onTextColorChange,
  onHighlightColorChange,
}: {
  textColor: string;
  highlightColor: string;
  onTextColorChange: (value: string) => void;
  onHighlightColorChange: (value: string) => void;
}) {
  const [target, setTarget] = useState<"text" | "highlight">("text");
  const isHighlight = target === "highlight";
  const label = isHighlight ? "Highlight" : "Text color";
  const value = isHighlight ? highlightColor || "#ffffff" : textColor || "#000000";
  const presets = isHighlight ? highlightPresets : textPresets;
  const onChange = isHighlight ? onHighlightColorChange : onTextColorChange;

  function shuffleTextColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 50) + 50;
    const lightness = Math.floor(Math.random() * 30) + 40;

    onTextColorChange(parseColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`).toString("hex"));
  }

  return (
    <Popover>
      <Tooltip>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Color formatting">
          <Icon icon="gravity-ui:palette" aria-hidden="true" />
        </Button>
        <Tooltip.Content>Color</Tooltip.Content>
      </Tooltip>
      <Popover.Content placement="bottom end" className="w-64">
        <Popover.Dialog aria-label="Color formatting" className="flex flex-col items-center gap-3">
          <Segment
            aria-label="Color target"
            className="w-full"
            selectedKey={target}
            size="sm"
            onSelectionChange={(key) => {
              if (key === "text" || key === "highlight") setTarget(key);
            }}
          >
            <Segment.Item id="text">
              <Icon icon="lucide:baseline" aria-hidden="true" />
              Text
            </Segment.Item>
            <Segment.Item id="highlight">
              <Icon icon="lucide:highlighter" aria-hidden="true" />
              Highlight
            </Segment.Item>
          </Segment>

          <ColorPicker
            className="w-full flex-col items-center gap-2"
            value={parseColor(value)}
            onChange={(color) => onChange(color.toString("hex"))}
          >
            <ColorSwatchPicker aria-label={`${label} presets`} size="xs" className="justify-center">
              {presets.map((color) => (
                <ColorSwatchPicker.Item key={color} color={color}>
                  <ColorSwatchPicker.Swatch />
                </ColorSwatchPicker.Item>
              ))}
            </ColorSwatchPicker>

            <ColorArea
              aria-label={`${label} area`}
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
            >
              <ColorArea.Thumb />
            </ColorArea>

            {isHighlight ? (
              <HighlightColorFields />
            ) : (
              <>
                <div className="flex w-full items-center gap-2">
                  <ColorSlider
                    aria-label="Hue"
                    channel="hue"
                    colorSpace="hsb"
                    className="min-w-0 flex-1"
                  >
                    <ColorSlider.Track>
                      <ColorSlider.Thumb />
                    </ColorSlider.Track>
                  </ColorSlider>
                  <Tooltip>
                    <Button
                      isIconOnly
                      aria-label="Shuffle color"
                      size="sm"
                      variant="ghost"
                      onPress={shuffleTextColor}
                    >
                      <Icon icon="gravity-ui:shuffle" aria-hidden="true" />
                    </Button>
                    <Tooltip.Content>Shuffle color</Tooltip.Content>
                  </Tooltip>
                </div>

                <ColorField aria-label="Text color hex value" fullWidth>
                  <ColorField.Group variant="secondary">
                    <ColorField.Prefix>
                      <ColorSwatch size="xs" />
                    </ColorField.Prefix>
                    <ColorField.Input className="min-w-0" />
                  </ColorField.Group>
                </ColorField>
              </>
            )}
          </ColorPicker>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
