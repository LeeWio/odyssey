"use client";

import { Skeleton } from "@heroui/react";
import { Segment, type SegmentRootProps } from "@heroui-pro/react";
import { useMounted } from "@mantine/hooks";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useStoredThemeVariant } from "@/hooks/use-stored-theme-variant";
import {
  DEFAULT_THEME_MODE,
  isThemeMode,
  isThemeVariant,
  setStoredThemeVariant,
  THEME_VARIANTS,
  type ThemeVariant,
} from "@/lib/theme";

const THEME_VARIANT_KEYS: Record<ThemeVariant, "brutal" | "glass" | "mouve"> = {
  brutalism: "brutal",
  glass: "glass",
  mouve: "mouve",
};

interface ModeSwitchProps {
  size?: SegmentRootProps["size"];
  variant?: SegmentRootProps["variant"];
}

export const ModeSwitch = ({ size = "sm", variant = "ghost" }: ModeSwitchProps) => {
  const t = useTranslations("Theme");
  const { setTheme, theme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-31" />;
  }

  return (
    <Segment
      aria-label={t("colorMode")}
      selectedKey={isThemeMode(theme) ? theme : DEFAULT_THEME_MODE}
      onSelectionChange={(key) => {
        if (!isThemeMode(key) || key === theme) return;
        setTheme(key);
      }}
      size={size}
      variant={variant}
    >
      <Segment.Item aria-label={t("light")} id="light">
        <Segment.Separator />
        <Icon icon="gravity-ui:sun" aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label={t("dark")} id="dark">
        <Segment.Separator />
        <Icon icon="gravity-ui:moon" aria-hidden="true" />
      </Segment.Item>
      <Segment.Item aria-label={t("system")} id="system">
        <Segment.Separator />
        <Icon icon="gravity-ui:display" aria-hidden="true" />
      </Segment.Item>
    </Segment>
  );
};

export const VariantSwitch = () => {
  const t = useTranslations("Theme");
  const selectedVariant = useStoredThemeVariant();
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="rounded-medium h-10 w-52" />;
  }

  return (
    <Segment
      aria-label={t("variant")}
      selectedKey={selectedVariant}
      onSelectionChange={(key) => {
        if (!isThemeVariant(key) || key === selectedVariant) return;
        setStoredThemeVariant(key);
      }}
      size="sm"
      variant="ghost"
    >
      {THEME_VARIANTS.map((variant) => (
        <Segment.Item key={variant} id={variant}>
          {t(THEME_VARIANT_KEYS[variant])}
        </Segment.Item>
      ))}
    </Segment>
  );
};
