"use client";

import { Segment } from "@heroui-pro/react";
import { Skeleton } from "@heroui/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { DisplayFillIcon, MoonFillIcon, SunMaxFillIcon } from "./icons";

export const ModeSwitch = () => {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <Skeleton className="h-10 w-31 rounded-medium" />;
  }

  return (
    <Segment
      selectedKey={theme || "system"}
      onSelectionChange={(key) => setTheme(String(key))}
      size="sm"
    >
      <Segment.Item aria-label="Light" id="light">
        <Segment.Separator />
        <SunMaxFillIcon />
      </Segment.Item>
      <Segment.Item aria-label="Dark" id="dark">
        <Segment.Separator />
        <MoonFillIcon />
      </Segment.Item>
      <Segment.Item aria-label="System" id="system">
        <Segment.Separator />
        <DisplayFillIcon />
      </Segment.Item>
    </Segment>
  );
};

export const useThemeSwitch = () => {
  const VariantSwitch = () => (
    <div className="text-sm text-default-500">Theme Variant Switcher Placeholder</div>
  );

  return { ModeSwitch, VariantSwitch };
};
