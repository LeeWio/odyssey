"use client";

import { Button, ColorSwatchPicker, parseColor, Tabs, Tooltip, Typography } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  SHADER_PRESET_GROUPS,
  groupForPreset,
  presetsInGroup,
  type ShaderPresetGroupId,
} from "./article-shader-presets";
import { ShaderBackgroundView } from "./shader-background-view";

function presetGradient(preset: { config: object; swatch: string }) {
  const config = preset.config as {
    colorBack?: string;
    colorFront?: string;
    colorHighlight?: string;
    colors?: readonly string[];
  };
  const colors = [
    ...(config.colors ?? []),
    config.colorFront,
    config.colorHighlight,
    config.colorBack,
  ].filter((color): color is string => Boolean(color));
  const unique = [...new Set(colors)].slice(0, 4);
  if (unique.length < 2) return preset.swatch;
  return `linear-gradient(135deg, ${unique.join(", ")})`;
}

function presetBySwatch(presets: { id: string; swatch: string }[], value: string) {
  const hex = parseColor(value).toString("hex").toLowerCase();
  return presets.find((item) => item.swatch.toLowerCase() === hex) ?? null;
}

export function ShaderBackgroundPreview({
  onChange,
  value = null,
}: {
  onChange?: (presetId: string) => void;
  value?: string | null;
} = {}) {
  const reducedMotion = useReducedMotion() ?? false;
  const selectedGroup = groupForPreset(value ?? "")?.id;
  const [groupId, setGroupId] = useState<ShaderPresetGroupId>(selectedGroup ?? "mesh");
  const [presetByGroup, setPresetByGroup] = useState<Record<ShaderPresetGroupId, string>>(() => ({
    mesh: presetsInGroup("mesh")[0]?.id ?? "",
    grain: presetsInGroup("grain")[0]?.id ?? "",
    field: presetsInGroup("field")[0]?.id ?? "",
    pattern: presetsInGroup("pattern")[0]?.id ?? "",
    ...(selectedGroup && value ? { [selectedGroup]: value } : {}),
  }));
  const [previewMode, setPreviewMode] = useState<"motion" | "static">("motion");
  const presets = presetsInGroup(groupId);
  const presetId = presetByGroup[groupId];
  const preset = presets.find((item) => item.id === presetId) ?? presets[0];
  const still = reducedMotion || previewMode === "static";

  if (!preset) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Typography type="body-sm" weight="medium">
          {preset.label}
        </Typography>
        {reducedMotion ? null : (
          <Button
            aria-pressed={still}
            size="sm"
            variant="secondary"
            onPress={() => setPreviewMode(still ? "motion" : "static")}
          >
            <span className="inline-block w-8 text-center">{still ? "Play" : "Still"}</span>
          </Button>
        )}
      </div>

      <div className="border-separator relative h-80 overflow-hidden rounded-2xl border">
        <ShaderBackgroundView mode={still ? "static" : "motion"} preset={preset} />
      </div>

      <Tabs
        className="w-full"
        selectedKey={groupId}
        onSelectionChange={(key) => {
          setGroupId(String(key) as ShaderPresetGroupId);
        }}
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Shader families" className="w-full justify-start">
            {SHADER_PRESET_GROUPS.map((group) => (
              <Tabs.Tab key={group.id} id={group.id}>
                {group.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <ColorSwatchPicker
        key={groupId}
        aria-label="Shader presets"
        className="w-full flex-nowrap overflow-x-auto"
        size="md"
        value={preset.swatch}
        variant="square"
        onChange={(color) => {
          const next = presetBySwatch(presets, color.toString("hex"));
          if (!next) return;
          setPresetByGroup((current) => ({ ...current, [groupId]: next.id }));
          onChange?.(next.id);
        }}
      >
        {presets.map((item) => (
          <ColorSwatchPicker.Item key={item.id} aria-label={item.label} color={item.swatch}>
            <Tooltip delay={300}>
              <Tooltip.Trigger className="contents">
                <ColorSwatchPicker.Swatch style={() => ({ background: presetGradient(item) })} />
              </Tooltip.Trigger>
              <Tooltip.Content placement="top">{item.label}</Tooltip.Content>
            </Tooltip>
            <ColorSwatchPicker.Indicator />
          </ColorSwatchPicker.Item>
        ))}
      </ColorSwatchPicker>
    </div>
  );
}
