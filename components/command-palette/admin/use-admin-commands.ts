"use client";

import { useMemo } from "react";
import { ChartColumn } from "@gravity-ui/icons";
import { useAppSelector } from "@/lib/hooks";
import { selectIsAdmin } from "@/lib/features/auth";
import { createNavigationCommand } from "../command-model";
import { CommandIntent, type CommandItem } from "../types";

export const useAdminCommands = (): CommandItem[] => {
  const isAdmin = useAppSelector(selectIsAdmin);

  return useMemo(() => {
    if (!isAdmin) {
      return [];
    }

    return [
      createNavigationCommand({
        id: "admin-dashboard",
        title: "Open Dashboard",
        description: "View site-wide analytics and statistics",
        icon: ChartColumn,
        category: "Analytics",
        source: "system",
        order: 1,
        keywords: ["dashboard", "stats", "analytics", "admin", "仪表盘", "数据", "统计"],
        intent: CommandIntent.NAVIGATE,
        payload: { href: "/test/dashboard" }, // Using test route as defined in the plan
        defaultVisible: true,
      }),
    ];
  }, [isAdmin]);
};
