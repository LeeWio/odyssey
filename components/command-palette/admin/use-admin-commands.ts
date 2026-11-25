"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ChartColumnIcon, FileTextIcon } from "@/components/icons";
import { NEW_RICH_TEXT_DRAFT_ID } from "@/components/rich-text/utils/editor-draft";
import { selectIsAdmin } from "@/lib/features/auth";
import { openRichText } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useDashboardNavigation } from "@/lib/hooks/use-dashboard-navigation";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export const useAdminCommands = (): CommandItem[] => {
  const t = useTranslations("Search");
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();
  const { toggleDashboard } = useDashboardNavigation();

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
            toggleDashboard();
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
            // The editor mounts only when both isOpen and activeId are set.
            // Toggling isOpen alone leaves the session unmounted.
            dispatch(
              openRichText({
                activeId: NEW_RICH_TEXT_DRAFT_ID,
                initialValue: null,
                isReadOnly: false,
              })
            );
          },
          closeOnExecute: true,
        },
        defaultVisible: true,
      }),
    ];
  }, [dispatch, isAdmin, t, toggleDashboard]);
};
