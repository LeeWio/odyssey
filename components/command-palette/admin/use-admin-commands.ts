"use client";

import { useMemo } from "react";
import { ChartColumnIcon, FileTextIcon } from "@/components/icons";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { toggleDashboard, toggleRichText } from "@/lib/features/ui";
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
          "仪表盘",
          "数据",
          "统计",
          "管理员",
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
          "编辑",
          "写文章",
          "富文本",
          "发布",
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
