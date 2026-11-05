"use client";

import { useMounted } from "@mantine/hooks";
import { useTheme } from "next-themes";
import {
  DEFAULT_RESOLVED_THEME_MODE,
  isResolvedThemeMode,
  type ResolvedThemeMode,
} from "@/lib/theme";

export function useResolvedThemeMode(): {
  mode: ResolvedThemeMode;
  mounted: boolean;
} {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  return {
    mode:
      mounted && isResolvedThemeMode(resolvedTheme) ? resolvedTheme : DEFAULT_RESOLVED_THEME_MODE,
    mounted,
  };
}
