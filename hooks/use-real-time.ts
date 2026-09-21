"use client";

import { useInterval, useTimeout } from "@mantine/hooks";
import { useCallback, useState } from "react";

/**
 * A hook that returns the current time and date formatted for the dashboard widget.
 * Updates every minute.
 */
export function useRealTime() {
  const [time, setTime] = useState(() => new Date());
  const [initialDelay] = useState(() => 60000 - (time.getTime() % 60000));
  const update = useCallback(() => setTime(new Date()), []);
  const { start } = useInterval(update, 60000);

  // Align the first tick to the next minute; Mantine cleans up both timers on unmount.
  useTimeout(
    () => {
      update();
      start();
    },
    initialDelay,
    { autoInvoke: true }
  );

  // Format: "Sat, 5/23"
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });

  const day = time.getDate().toString();
  const weekdayName = time.toLocaleDateString("en-US", { weekday: "short" });

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  return { formattedDate, day, weekdayName, hours, minutes };
}
