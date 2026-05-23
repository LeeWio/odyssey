"use client";

import { Segment } from "@heroui-pro/react";
import { Skeleton } from "@heroui/react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";

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
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
          <path d="M12 19a1 1 0 0 1 .993.883L13 20v1a1 1 0 0 1-1.993.117L11 21v-1a1 1 0 0 1 1-1m6.313-2.09l.094.083l.7.7a1 1 0 0 1-1.32 1.497l-.094-.083l-.7-.7a1 1 0 0 1 1.218-1.567zm-11.306.083a1 1 0 0 1 .083 1.32l-.083.094l-.7.7a1 1 0 0 1-1.497-1.32l.083-.094l.7-.7a1 1 0 0 1 1.414 0M4 11a1 1 0 0 1 .117 1.993L4 13H3a1 1 0 0 1-.117-1.993L3 11zm17 0a1 1 0 0 1 .117 1.993L21 13h-1a1 1 0 0 1-.117-1.993L20 11zM6.213 4.81l.094.083l.7.7a1 1 0 0 1-1.32 1.497l-.094-.083l-.7-.7A1 1 0 0 1 6.11 4.74zm12.894.083a1 1 0 0 1 .083 1.32l-.083.094l-.7.7a1 1 0 0 1-1.497-1.32l.083-.094l.7-.7a1 1 0 0 1 1.414 0M12 2a1 1 0 0 1 .993.883L13 3v1a1 1 0 0 1-1.993.117L11 4V3a1 1 0 0 1 1-1m0 5a5 5 0 1 1-4.995 5.217L7 12l.005-.217A5 5 0 0 1 12 7" />
        </svg>
      </Segment.Item>
      <Segment.Item aria-label="Dark" id="dark">
        <Segment.Separator />
        <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
          <path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341-.82-.476-1.644-1.298-1.31a6.5 6.5 0 0 1-6.864-10.787l.077-.08c.551-.63.113-1.653-.758-1.653h-.266l-.068-.006z" />
        </svg>
      </Segment.Item>
      <Segment.Item aria-label="System" id="system">
        <Segment.Separator />
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M3 5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm4 15h10m-8-4v4m6-4v4" />
        </svg>
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
