"use client";

import { useMemo } from "react";
import { ChartColumnIcon } from "@/components/icons";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { toggleDashboard } from "@/lib/features/ui";
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
    ];
  }, [isAdmin, dispatch]);
};
