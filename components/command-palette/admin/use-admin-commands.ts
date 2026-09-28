"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ChartColumnIcon, FileTextIcon } from "@/components/icons";
import { selectIsAdmin } from "@/lib/features/auth";
import { toggleDashboard, toggleRichText } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export const useAdminCommands = (): CommandItem[] => {
  const t = useTranslations("Search");
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();

  return useMemo(() => {
    if (!isAdmin) {
      return [];
    }

    return [
      createActionCommand({
        id: "admin-dashboard",
        title: t("commands.adminDashboard"),
        description: t("commands.adminDashboardHint"),
        icon: ChartColumnIcon,
        category: "Analytics",
        source: "system",
        order: 1,
        keywords: [
          "dashboard",
          "stats",
          "analytics",
          "admin",
          "open dashboard",
          "management",
          "board",
          "data",
          "statistics",
          "administrator",
        ],
        intent: CommandIntent.EXECUTE,
        payload: {
          action: () => {
            dispatch(toggleDashboard());
          },
          closeOnExecute: true,
        },
        defaultVisible: true,
      }),
      createActionCommand({
        id: "admin-rich-text",
        title: t("commands.postEditor"),
        description: t("commands.postEditorHint"),
        icon: FileTextIcon,
        category: "Management",
        source: "system",
        order: 2,
        keywords: [
          "editor",
          "rich text",
          "post",
          "create",
          "write",
          "blog",
          "edit",
          "write article",
          "rich text editor",
          "publish",
        ],
        intent: CommandIntent.EXECUTE,
        payload: {
          action: () => {
            dispatch(toggleRichText());
          },
          closeOnExecute: true,
        },
        defaultVisible: true,
      }),
    ];
  }, [dispatch, isAdmin, t]);
};
