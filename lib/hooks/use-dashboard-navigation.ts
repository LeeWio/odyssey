"use client";

import { useCallback } from "react";

import { useQueryState } from "./use-query-state";

export function useDashboardNavigation() {
  const { searchParams, updateQuery } = useQueryState();
  const dashboardPath = searchParams.get("dashboard");

  const openDashboard = useCallback(
    (path = "/") => {
      updateQuery({ dashboard: path }, { mode: "push" });
    },
    [updateQuery]
  );

  const closeDashboard = useCallback(() => {
    updateQuery({ dashboard: null }, { mode: "replace" });
  }, [updateQuery]);

  const toggleDashboard = useCallback(() => {
    updateQuery(
      { dashboard: dashboardPath ? null : "/" },
      { mode: dashboardPath ? "replace" : "push" }
    );
  }, [dashboardPath, updateQuery]);

  return {
    dashboardPath,
    isDashboardOpen: dashboardPath !== null,
    openDashboard,
    closeDashboard,
    toggleDashboard,
  };
}
