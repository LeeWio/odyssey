"use client";

import { Skeleton } from "@heroui/react";
import { Segment } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";
import { useTheme } from "next-themes";
import { selectThemeVariant, setThemeVariant } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  coerceThemeMode,
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_VARIANT,
  THEME_VARIANTS,
  type ThemeVariant,
} from "@/lib/theme";
import { DisplayFillIcon, MoonFillIcon, SunMaxFillIcon } from "./icons";

const THEME_VARIANT_LABELS: Record<ThemeVariant, string> = {
  brutalism: "Brutal",
  glass: "Glass",
  mouve: "Mouve",
};

export const ModeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-31" />;
  }

  return (
    <Segment
      aria-label="Color mode"
      selectedKey={theme || DEFAULT_THEME_MODE}
      onSelectionChange={(key) => setTheme(coerceThemeMode(String(key)))}
      size="sm"
    >
      <Segment.Item aria-label="Light" id="light">
        <Segment.Separator />
        <SunMaxFillIcon aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label="Dark" id="dark">
        <Segment.Separator />
        <MoonFillIcon aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label="System" id="system">
        <Segment.Separator />
        <DisplayFillIcon aria-hidden="true" />
      </Segment.Item>
    </Segment>
  );
};

export const VariantSwitch = () => {
  const dispatch = useAppDispatch();
  const selectedVariant = useAppSelector(selectThemeVariant) ?? DEFAULT_THEME_VARIANT;
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-52" />;
  }

  return (
    <Segment
      aria-label="Theme variant"
      selectedKey={selectedVariant}
      onSelectionChange={(key) => dispatch(setThemeVariant(String(key) as ThemeVariant))}
      size="sm"
      variant="ghost"
    >
      {THEME_VARIANTS.map((variant) => (
        <Segment.Item key={variant} id={variant}>
          {THEME_VARIANT_LABELS[variant]}
        </Segment.Item>
      ))}
    </Segment>
  );
};

export const useThemeSwitch = () => {
  return { ModeSwitch, VariantSwitch };
};
