import { useState, useEffect } from "react";

/**
 * A hook that returns the current time and date formatted for the dashboard widget.
 * Updates every minute.
 */
export function useRealTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update every minute (on the minute)
    const update = () => setTime(new Date());
    
    // Initial delay to sync with the next minute start
    const delay = 60000 - (Date.now() % 60000);
    const timeout = setTimeout(() => {
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, []);

  // Format: "Sat, 5/23"
  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");

  return { formattedDate, hours, minutes };
}
