import { z } from "zod";

export const AnalyticsTimestampSchema = z.iso.datetime({ offset: true });

const formatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatAnalyticsTimestamp(value?: string | null): string {
  const timestamp = AnalyticsTimestampSchema.safeParse(value);
  return timestamp.success ? formatter.format(new Date(timestamp.data)) : "—";
}
