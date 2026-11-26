import { Button, Header, Label, Popover, Tooltip } from "@heroui/react";
import { Segment } from "@heroui-pro/react/segment";
import { TYPOGRAPHY_PRESETS, type TypographyPreset } from "../typography-presets";
import { FontFamilyPicker } from "./font-family-picker";
import { FontSizePicker } from "./font-size-picker";
import { LineHeightPicker } from "./line-height-picker";

export function TypographyPopover({
  fontFamily,
  fontSize,
  lineHeight,
  typographyPreset,
  onFontFamilyChange,
  onFontSizeChange,
  onLineHeightChange,
  onPresetChange,
}: {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  typographyPreset: TypographyPreset["id"] | null;
  onFontFamilyChange: (value: string) => void;
  onFontSizeChange: (value: string) => void;
  onLineHeightChange: (value: string) => void;
  onPresetChange: (preset: TypographyPreset) => void;
}) {
  return (
    <Popover>
      <Tooltip>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Typography">
          Aa
        </Button>
        <Tooltip.Content>Typography</Tooltip.Content>
      </Tooltip>
      <Popover.Content placement="bottom start" className="w-72 max-w-[calc(100dvw-1.5rem)]">
        <Popover.Dialog className="flex flex-col gap-2">
          <Popover.Heading className="text-base font-semibold">Typography</Popover.Heading>
          <div className="flex flex-col gap-1">
            <Header className="px-0">
              <h3>Presets</h3>
            </Header>
            <Segment
              aria-label="Presets"
              className="w-full"
              // Keep custom settings controlled in HeroUI Pro 1.0.1, where null uses internal selection.
              selectedKey={typographyPreset ?? "custom"}
              size="sm"
              onSelectionChange={(key) => {
                const preset = TYPOGRAPHY_PRESETS.find(({ id }) => id === key);
                if (preset) onPresetChange(preset);
              }}
            >
              {TYPOGRAPHY_PRESETS.map(({ id, label }) => (
                <Segment.Item key={id} id={id}>
                  {label}
                </Segment.Item>
              ))}
            </Segment>
          </div>
          <div className="flex flex-col gap-1">
            <Header className="px-0">
              <h3>Custom</h3>
            </Header>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,9rem)] items-center gap-x-3 gap-y-2">
              <FontFamilyPicker value={fontFamily} onChange={onFontFamilyChange} />
              <Label>Font size</Label>
              <div className="flex h-9 items-center justify-end">
                <FontSizePicker value={fontSize} onChange={onFontSizeChange} />
              </div>
              <LineHeightPicker value={lineHeight} onChange={onLineHeightChange} />
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
