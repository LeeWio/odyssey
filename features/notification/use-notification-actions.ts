"use client";

import { useCallback, useRef, useState } from "react";

type NotificationAction = "read" | "save" | "delete" | "complete" | "reopen";
type NotificationBulkAction = "read-all" | "clear-read";

/** Independent rows may proceed together; bulk actions require an idle surface. */
export function useNotificationActions() {
  const inFlight = useRef(new Map<number, NotificationAction>());
  const bulkInFlight = useRef<NotificationBulkAction | null>(null);
  const [pendingBulkAction, setPendingBulkAction] = useState<NotificationBulkAction | null>(null);
  const [pendingActions, setPendingActions] = useState<ReadonlyMap<number, NotificationAction>>(
    new Map()
  );
  const run = useCallback(
    async (id: number, action: NotificationAction, request: () => Promise<unknown>) => {
      if (bulkInFlight.current || inFlight.current.has(id)) return false;
      inFlight.current.set(id, action);
      setPendingActions(new Map(inFlight.current));
      try {
        await request();
        return true;
      } catch {
        // Notification API mutations own their error toasts.
        return false;
      } finally {
        inFlight.current.delete(id);
        setPendingActions(new Map(inFlight.current));
      }
    },
    []
  );
  const runBulk = useCallback(
    async (action: NotificationBulkAction, request: () => Promise<unknown>) => {
      if (bulkInFlight.current || inFlight.current.size > 0) return false;
      bulkInFlight.current = action;
      setPendingBulkAction(action);
      try {
        await request();
        return true;
      } catch {
        // Notification API mutations own their error toasts.
        return false;
      } finally {
        bulkInFlight.current = null;
        setPendingBulkAction(null);
      }
    },
    []
  );
  // Overlay close events can arrive before React renders the pending state.
  const isBulkRunning = useCallback(() => bulkInFlight.current !== null, []);
  return { pendingActions, pendingBulkAction, run, runBulk, isBulkRunning };
}
