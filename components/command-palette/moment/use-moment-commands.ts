"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { FileTextIcon } from "@/components/icons";
import { selectIsAuthenticated } from "@/lib/features/auth";
import { setLoginOpen, setMomentPublisherOpen } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export function useMomentCommands(): CommandItem[] {
  const t = useTranslations("Search");
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return useMemo(
    () => [
      createActionCommand({
        id: "write-moment",
        title: t("commands.writeMoment"),
        description: t("commands.writeMomentHint"),
        icon: FileTextIcon,
        category: "System",
        source: "system",
        order: 20,
        keywords: [
          "写动态",
          "动态",
          "moment",
          "publish",
          "compose",
          "note",
          "post moment",
          "朋友圈",
        ],
        intent: CommandIntent.EXECUTE,
        defaultVisible: true,
        payload: {
          action: () => {
            if (isAuthenticated) {
              dispatch(setMomentPublisherOpen(true));
              return;
            }
            dispatch(setLoginOpen(true));
          },
          closeOnExecute: true,
        },
      }),
    ],
    [dispatch, isAuthenticated, t]
  );
}
