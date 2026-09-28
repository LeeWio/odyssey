"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { PlayFillIcon, TargetIcon } from "@/components/icons";
import { selectIsMiniPlayerOpen, setMiniPlayerOpen, setSheetOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export function useSystemCommands(): CommandItem[] {
  const t = useTranslations("Search");
  const dispatch = useAppDispatch();
  const isMiniPlayerOpen = useAppSelector(selectIsMiniPlayerOpen);

  return useMemo(
    () => [
      createActionCommand({
        id: "system-open-control-center",
        title: t("commands.controlCenter"),
        description: t("commands.controlCenterHint"),
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
      createActionCommand({
        id: "system-toggle-mini-player",
        title: isMiniPlayerOpen ? t("commands.closePlayer") : t("commands.openPlayer"),
        description: isMiniPlayerOpen ? t("commands.hidePlayer") : t("commands.showPlayer"),
        icon: PlayFillIcon,
        category: "System",
        source: "system",
        order: 1110,
        keywords: ["mini player", "miniplayer", "music", "media", "播放器", "迷你播放器", "音乐"],
        intent: CommandIntent.EXECUTE,
        defaultVisible: true,
        payload: {
          action: () => {
            dispatch(setMiniPlayerOpen(!isMiniPlayerOpen));
          },
          closeOnExecute: true,
        },
      }),
    ],
    [dispatch, isMiniPlayerOpen, t]
  );
}
