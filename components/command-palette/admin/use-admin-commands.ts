"use client";

import { useMemo } from "react";
import { ChartColumnIcon } from "@/components/icons";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { setDashboardOpen } from "@/lib/features/ui";
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
        title: "Open Dashboard",
        description: "View site-wide analytics and statistics",
        icon: ChartColumnIcon,
        category: "Analytics",
        source: "system",
        order: 1,
        keywords: ["dashboard", "stats", "analytics", "admin", "仪表盘", "数据", "统计"],
        intent: CommandIntent.EXECUTE,
        payload: { 
          action: () => {
            dispatch(setDashboardOpen(true));
          },
          closeOnExecute: true 
        },
        defaultVisible: true,
      }),
    ];
  }, [isAdmin, dispatch]);
};
