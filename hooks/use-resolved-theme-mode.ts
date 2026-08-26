"use client";

import { useMounted } from "@mantine/hooks";
import { useTheme } from "next-themes";
import {
  coerceResolvedThemeMode,
  coerceThemeMode,
  DEFAULT_RESOLVED_THEME_MODE,
  resolveThemeMode,
  type ResolvedThemeMode,
} from "@/lib/theme";

export function useResolvedThemeMode(): {
  mode: ResolvedThemeMode;
  mounted: boolean;
} {
  const { resolvedTheme, theme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return { mode: DEFAULT_RESOLVED_THEME_MODE, mounted: false };
  }

  return {
    mode: resolveThemeMode(coerceThemeMode(theme), coerceResolvedThemeMode(resolvedTheme)),
    mounted: true,
  };
}
