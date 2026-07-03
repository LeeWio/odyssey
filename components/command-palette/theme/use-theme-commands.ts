"use client";

import type React from "react";
import { useMemo } from "react";
import { useTheme } from "next-themes";
import {
  DisplayFillIcon,
  GearIcon,
  MoonFillIcon,
  // SparklesIcon,
  SunMaxFillIcon,
  // TargetIcon,
} from "@/components/icons";
// import { selectThemeVariant, setThemeVariant, type ThemeVariant } from "@/lib/features/ui";
// import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createActionCommand, createNavigationCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

interface ThemeModeDefinition {
  id: string;
  title: string;
  theme: "light" | "dark" | "system";
  icon: React.ElementType;
  keywords: readonly string[];
}

/*
interface ThemeVariantDefinition {
  variant: ThemeVariant;
  title: string;
  description: string;
  icon: React.ElementType;
  keywords: readonly string[];
}
*/

const SHARED_THEME_KEYWORDS = ["theme", "appearance", "mode", "color", "palette", "style"] as const;

const THEME_MODES: readonly ThemeModeDefinition[] = [
  {
    id: "light",
    title: "Light",
    theme: "light",
    icon: SunMaxFillIcon,
    keywords: ["bright", "white", "day", "light", "sunny"],
  },
  {
    id: "dark",
    title: "Dark",
    theme: "dark",
    icon: MoonFillIcon,
    keywords: ["night", "black", "darkness", "nighttime", "shadow"],
  },
  {
    id: "system",
    title: "System",
    theme: "system",
    icon: DisplayFillIcon,
    keywords: ["auto", "device", "os", "default", "automatic", "hardware"],
  },
];

/*
const THEME_VARIANTS: readonly ThemeVariantDefinition[] = [
  {
    variant: "default",
    title: "Default",
    description: "Remove custom styling and use the base theme",
    icon: GearIcon,
    keywords: ["base", "standard", "reset", "default"],
  },
  {
    variant: "glass",
    title: "Glass",
    description: "Apply the glassmorphism theme variant",
    icon: SparklesIcon,
    keywords: ["frosted", "transparent", "blur", "glass"],
  },
  {
    variant: "mouve",
    title: "Mouve",
    description: "Apply the Mouve theme variant",
    icon: DisplayFillIcon,
    keywords: ["soft", "editorial", "mauve", "purple"],
  },
  {
    variant: "brutalism",
    title: "Brutalism",
    description: "Apply the brutalist theme variant",
    icon: TargetIcon,
    keywords: ["bold", "graphic", "sharp", "brutalist"],
  },
];
*/

export const useThemeCommands = (): CommandItem[] => {
  const { theme, setTheme } = useTheme();

  return useMemo(() => {
    const modeCommands = THEME_MODES.map((mode, index) =>
      createActionCommand({
        id: `theme-mode-${mode.id}`,
        title: `Switch to ${mode.title} Mode`,
        description:
          theme === mode.theme
            ? "Current color mode"
            : mode.theme === "system"
              ? "Match the device appearance"
              : `Use a ${mode.theme} interface`,
        icon: mode.icon,
        category: "System",
        source: "theme",
        order: 1000 + index,
        keywords: [...mode.keywords, ...SHARED_THEME_KEYWORDS],
        intent: CommandIntent.EXECUTE,
        isActive: theme === mode.theme,
        defaultVisible: true,
        payload: {
          action: () => setTheme(mode.theme),
          closeOnExecute: true,
        },
      })
    );

    const systemSettingsCommand = createNavigationCommand({
      id: "system-workspace-settings",
      title: "Open workspace settings",
      description: "Manage system preferences",
      icon: GearIcon,
      category: "System",
      source: "system",
      order: 1200,
      keywords: ["preferences", "config", "setup", "workspace settings", "preferences list"],
      intent: CommandIntent.NAVIGATE,
      defaultVisible: true,
      payload: { href: "/" },
    });

    return [...modeCommands, systemSettingsCommand];
  }, [setTheme, theme]);
};
