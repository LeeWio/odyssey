"use client";

import { useMemo } from "react";
import { ChartColumnIcon, FileTextIcon } from "@/components/icons";
import { selectIsAdmin } from "@/lib/features/auth";
import { toggleDashboard, toggleRichText } from "@/lib/features/ui";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createActionCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export const useAdminCommands = (): CommandItem[] => {
  const isAdmin = useAppSelector(selectIsAdmin);
  const dispatch = useAppDispatch();

  return useMemo(() => {
    if (!isAdmin) {
      return [];
    }

    return [
      createActionCommand({
        id: "admin-dashboard",
        title: "Open Admin Dashboard",
        description: "View site-wide analytics and statistics",
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
        title: "Open Post Editor",
        description: "Create or edit a blog post with rich text",
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
  }, [isAdmin, dispatch]);
};
