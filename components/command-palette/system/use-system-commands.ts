"use client";

import { useMemo } from "react";
import { TargetIcon } from "@/components/icons";
import { setSheetOpen } from "@/lib/features/ui";
import { useAppDispatch } from "@/lib/hooks";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export function useSystemCommands(): CommandItem[] {
  const dispatch = useAppDispatch();

  return useMemo(
    () => [
      createActionCommand({
        id: "system-open-control-center",
        title: "Open control center",
        description: "View markets, time, music, and appearance controls",
        icon: TargetIcon,
        category: "System",
        source: "system",
        order: 1100,
        keywords: [
          "control center",
          "markets",
          "stocks",
          "music",
          "themes",
          "appearance",
          "command j",
        ],
        shortcut: ["mod", "J"],
        intent: CommandIntent.EXECUTE,
        defaultVisible: true,
        payload: {
          action: () => {
            dispatch(setSheetOpen(true));
          },
          closeOnExecute: true,
        },
      }),
    ],
    [dispatch]
  );
}
