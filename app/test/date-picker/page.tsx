"use client";

import { useMemo, useState, useCallback } from "react";
import {
  Button,
  DateField,
  DateRangePicker,
  Label,
  RangeCalendar,
  Select,
  ListBox,
  Switch,
  Separator,
  Chip,
  TimeField,
  useLocale,
  Tooltip,
  FieldError,
  Description,
} from "@heroui/react";
import {
  DateFormatter,
  getLocalTimeZone,
  parseZonedDateTime,
  today,
  CalendarDate,
} from "@internationalized/date";
import type { DateValue, TimeValue } from "@heroui/react";
import { Icon } from "@iconify/react";

// ==========================================
// --- MOCK LOG AUDIT SPECIFICATIONS ---
// ==========================================

interface AuditLog {
  id: string;
  timestamp: string; // ISO string e.g. "2026-07-09T10:00:00Z"
  category: "Security" | "API" | "System" | "Database";
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  operator: string;
  durationMs: number;
}

const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-07-09T08:30:00Z", // Today morning
    category: "Security",
    severity: "info",
    message: "User 'weili_dev' successfully authenticated via SSO session token.",
    operator: "weili_dev",
    durationMs: 82,
  },
  {
    id: "LOG-002",
    timestamp: "2026-07-09T04:15:00Z", // Today early morning
    category: "API",
    severity: "warning",
    message: "Rate limit threshold reached (80%) for endpoint /api/v1/posts/query.",
    operator: "anonymous",
    durationMs: 140,
  },
  {
    id: "LOG-003",
    timestamp: "2026-07-08T18:45:00Z", // Yesterday
    category: "Database",
    severity: "error",
    message: "Deadlock detected on transaction index locking table 'category_response'.",
    operator: "system_cron",
    durationMs: 450,
  },
  {
    id: "LOG-004",
    timestamp: "2026-07-08T11:20:00Z", // Yesterday
    category: "System",
    severity: "info",
    message: "Successfully synchronized VoltAgent awesome-design-md CDN assets.",
    operator: "system_cron",
    durationMs: 1205,
  },
  {
    id: "LOG-005",
    timestamp: "2026-07-05T14:10:00Z", // Last 7 Days
    category: "Security",
    severity: "critical",
    message: "Unauthorized cross-origin resource access attempt on /api/v1/permissions.",
    operator: "192.168.1.145",
    durationMs: 12,
  },
  {
    id: "LOG-006",
    timestamp: "2026-07-02T09:05:00Z", // Last 7 Days
    category: "API",
    severity: "info",
    message: "Immersive blog Reader View compiled. Cache warmed up for slug '1'.",
    operator: "Aether",
    durationMs: 88,
  },
  {
    id: "LOG-007",
    timestamp: "2026-06-25T16:30:00Z", // Last 30 Days
    category: "System",
    severity: "info",
    message: "Pre-flight type checks passed successfully in 12.4s. Production assets built.",
    operator: "Sentry",
    durationMs: 12400,
  },
  {
    id: "LOG-008",
    timestamp: "2026-06-15T11:00:00Z", // Last 30 Days
    category: "Database",
    severity: "info",
    message: "Schema migration: added constraint 'fk_comments_parent' completed.",
    operator: "weili_dev",
    durationMs: 3200,
  },
  {
    id: "LOG-009",
    timestamp: "2026-05-18T10:15:00Z", // Older than 30 days
    category: "System",
    severity: "error",
    message: "Legacy theme configuration 'mouve-dark' failed to reconcile with next-themes.",
    operator: "weili_dev",
    durationMs: 230,
  },
];

type Granularity = "day" | "hour" | "minute" | "second";
type HourCycle = 12 | 24;

type DateRange = {
  start: DateValue;
  end: DateValue;
};

export default function DatePickerTestPage() {
  const { locale } = useLocale();

  // --- Configuration states ---
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [hourCycle, setHourCycle] = useState<HourCycle>(24);
  const [hideTimeZone, setHideTimeZone] = useState(false);
  const [shouldForceLeadingZeros, setShouldForceLeadingZeros] = useState(false);
  const [isValidationMode, setIsValidationMode] = useState(false);

  // --- Selected Date Range ---
  // Initial value defaults to last 7 days (today to 6 days ago)
  const localTimeZone = getLocalTimeZone();
  const currentToday = today(localTimeZone);

  const [value, setValue] = useState<DateRange | null>(() => {
    return {
      start: currentToday.subtract({ days: 6 }),
      end: currentToday,
    };
  });

  const [mountTime] = useState(() => Date.now());

  // Re-initialize default value when granularity changes to avoid timezone/format mismatches
  const [prevGranularity, setPrevGranularity] = useState<Granularity>(granularity);
  if (granularity !== prevGranularity) {
    setPrevGranularity(granularity);
    const tz = getLocalTimeZone();
    const t = today(tz);
    if (granularity === "day") {
      setValue({
        start: t.subtract({ days: 6 }),
        end: t,
      });
    } else {
      setValue({
        start: parseZonedDateTime(`2026-07-03T00:00:00[${tz}]`),
        end: parseZonedDateTime(`2026-07-09T23:59:59[${tz}]`),
      });
    }
  }

  // Date Range Formatter
  const dateFormatter = useMemo(() => {
    return new DateFormatter(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: granularity !== "day" ? "numeric" : undefined,
      minute: granularity !== "day" && granularity !== "hour" ? "numeric" : undefined,
      second: granularity === "second" ? "numeric" : undefined,
    });
  }, [locale, granularity]);

  const formatDateRange = useCallback(
    (range: DateRange) => {
      try {
        const tz = getLocalTimeZone();
        const start = range.start.toDate(tz);
        const end = range.end.toDate(tz);
        return dateFormatter.formatRange(start, end);
      } catch {
        return `${range.start.toString()} - ${range.end.toString()}`;
      }
    },
    [dateFormatter]
  );

  // --- Quick presets handlers ---
  const applyPreset = (
    presetName: "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "lastMonth"
  ) => {
    const tz = getLocalTimeZone();
    const t = today(tz);

    if (granularity === "day") {
      switch (presetName) {
        case "today":
          setValue({ start: t, end: t });
          break;
        case "yesterday": {
          const y = t.subtract({ days: 1 });
          setValue({ start: y, end: y });
          break;
        }
        case "last7":
          setValue({ start: t.subtract({ days: 6 }), end: t });
          break;
        case "last30":
          setValue({ start: t.subtract({ days: 29 }), end: t });
          break;
        case "thisMonth":
          setValue({ start: new CalendarDate(t.year, t.month, 1), end: t });
          break;
        case "lastMonth": {
          let prevYear = t.year;
          let prevMonth = t.month - 1;
          if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
          }
          const firstOfCurrent = new CalendarDate(t.year, t.month, 1);
          const lastOfPrev = firstOfCurrent.subtract({ days: 1 });
          setValue({
            start: new CalendarDate(prevYear, prevMonth, 1),
            end: lastOfPrev,
          });
          break;
        }
      }
    } else {
      // With time granularity presets
      const isoTodayStr = new Date().toISOString().split("T")[0];
      switch (presetName) {
        case "today":
          setValue({
            start: parseZonedDateTime(`${isoTodayStr}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoTodayStr}T23:59:59[${tz}]`),
          });
          break;
        case "yesterday": {
          const yesterdayObj = new Date();
          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
          const isoYesterdayStr = yesterdayObj.toISOString().split("T")[0];
          setValue({
            start: parseZonedDateTime(`${isoYesterdayStr}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoYesterdayStr}T23:59:59[${tz}]`),
          });
          break;
        }
        case "last7": {
          const prev7Obj = new Date();
          prev7Obj.setDate(prev7Obj.getDate() - 6);
          const iso7Str = prev7Obj.toISOString().split("T")[0];
          setValue({
            start: parseZonedDateTime(`${iso7Str}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoTodayStr}T23:59:59[${tz}]`),
          });
          break;
        }
        case "last30": {
          const prev30Obj = new Date();
          prev30Obj.setDate(prev30Obj.getDate() - 29);
          const iso30Str = prev30Obj.toISOString().split("T")[0];
          setValue({
            start: parseZonedDateTime(`${iso30Str}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoTodayStr}T23:59:59[${tz}]`),
          });
          break;
        }
        case "thisMonth": {
          const firstDayIso = `${isoTodayStr.substring(0, 8)}01`;
          setValue({
            start: parseZonedDateTime(`${firstDayIso}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoTodayStr}T23:59:59[${tz}]`),
          });
          break;
        }
        case "lastMonth": {
          const now = new Date();
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

          const isoFirstLastMonth = firstDayLastMonth.toISOString().split("T")[0];
          const isoLastLastMonth = lastDayLastMonth.toISOString().split("T")[0];

          setValue({
            start: parseZonedDateTime(`${isoFirstLastMonth}T00:00:00[${tz}]`),
            end: parseZonedDateTime(`${isoLastLastMonth}T23:59:59[${tz}]`),
          });
          break;
        }
      }
    }
  };

  // --- Live filtering & analytics calculation ---
  const isInvalid = useMemo(() => {
    if (!isValidationMode || !value) return false;

    const tz = getLocalTimeZone();
    const startJs = value.start.toDate(tz);
    const endJs = value.end.toDate(tz);

    // Custom Validation: Range cannot exceed 30 days and cannot start in the future
    const gapMs = endJs.getTime() - startJs.getTime();
    const maxGapMs = 30 * 24 * 60 * 60 * 1000;

    return gapMs > maxGapMs || startJs.getTime() > mountTime;
  }, [value, isValidationMode, mountTime]);

  const filteredLogs = useMemo(() => {
    if (!value || isInvalid) return [];

    const tz = getLocalTimeZone();
    const startMs = value.start.toDate(tz).getTime();

    // For "day" granularity, make the end date inclusive of the entire day (up to 23:59:59)
    let endMs = value.end.toDate(tz).getTime();
    if (granularity === "day") {
      endMs += 24 * 60 * 60 * 1000 - 1; // plus 23h 59m 59
    }

    return MOCK_AUDIT_LOGS.filter((log) => {
      const logMs = new Date(log.timestamp).getTime();
      return logMs >= startMs && logMs <= endMs;
    });
  }, [value, isInvalid, granularity]);

  // Calculated Stats
  const stats = useMemo(() => {
    const count = filteredLogs.length;
    if (count === 0) {
      return { total: 0, errorRate: 0, avgDuration: 0, criticalAlerts: 0 };
    }

    const errorsCount = filteredLogs.filter(
      (log) => log.severity === "error" || log.severity === "critical"
    ).length;
    const criticalCount = filteredLogs.filter((log) => log.severity === "critical").length;
    const totalDuration = filteredLogs.reduce((sum, log) => sum + log.durationMs, 0);

    return {
      total: count,
      errorRate: Math.round((errorsCount / count) * 100),
      avgDuration: Math.round(totalDuration / count),
      criticalAlerts: criticalCount,
    };
  }, [filteredLogs]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
      {/* Header */}
      <div className="border-border flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Complex DateRangePicker Demo
          </h1>
          <p className="text-muted mt-1 text-sm">
            Interactive playground testing the composable DateRangePicker API with presets, timezone
            config, custom validation, and live analytics logs integration.
          </p>
        </div>
        <Chip color="accent" variant="soft" className="font-mono text-xs">
          Locale: {locale}
        </Chip>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Config Panel & Picker Component */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="bg-surface border-border flex flex-col gap-5 rounded-2xl border p-5 shadow-sm">
            <h2 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
              <Icon icon="gravity-ui:sliders" className="text-accent size-4" />
              1. Quick Presets
            </h2>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "today", label: "Today", desc: "今天" },
                  { id: "yesterday", label: "Yesterday", desc: "昨天" },
                  { id: "last7", label: "Last 7 Days", desc: "最近7天" },
                  { id: "last30", label: "Last 30 Days", desc: "最近30天" },
                  { id: "thisMonth", label: "This Month", desc: "本月" },
                  { id: "lastMonth", label: "Last Month", desc: "上个月" },
                ] as const
              ).map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant="ghost"
                  className="flex h-11 flex-col items-center justify-center p-1 text-xs"
                  onPress={() => applyPreset(p.id)}
                >
                  <span className="leading-tight font-semibold">{p.label}</span>
                  <span className="text-muted scale-90 text-[10px]">{p.desc}</span>
                </Button>
              ))}
            </div>

            <Separator className="bg-border/60" />

            {/* Custom Composed DateRangePicker Component */}
            <div className="flex flex-col gap-2">
              <h2 className="text-foreground mb-1 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                <Icon icon="gravity-ui:calendar" className="text-primary size-4" />
                2. Composed DateRangePicker
              </h2>

              <DateRangePicker
                key={`${granularity}-${hourCycle}-${hideTimeZone}-${shouldForceLeadingZeros}`}
                className="w-full"
                value={value}
                onChange={setValue}
                granularity={granularity}
                hourCycle={hourCycle}
                hideTimeZone={hideTimeZone}
                shouldForceLeadingZeros={shouldForceLeadingZeros}
                isInvalid={isInvalid}
                endName="tripEndDate"
                startName="tripStartDate"
              >
                {({ state }) => (
                  <>
                    <Label className="mb-1 text-sm font-semibold select-none">
                      Interactive Log Date Range
                    </Label>
                    <DateField.Group
                      fullWidth
                      variant="secondary"
                      className="border-border bg-surface/50 hover:border-default-400 rounded-xl border transition-colors"
                    >
                      <DateField.InputContainer>
                        <DateField.Input slot="start">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateRangePicker.RangeSeparator className="text-muted px-2" />
                        <DateField.Input slot="end">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                      </DateField.InputContainer>
                      <DateField.Suffix>
                        <DateRangePicker.Trigger className="hover:bg-default-100 flex size-8 items-center justify-center rounded-lg transition-colors">
                          <DateRangePicker.TriggerIndicator className="text-muted" />
                        </DateRangePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>

                    {isInvalid ? (
                      <FieldError className="text-danger mt-1.5 flex items-center gap-1 text-xs font-semibold">
                        <Icon icon="gravity-ui:circle-exclamation-fill" className="size-3.5" />
                        Validation Error: Limit 30 days maximum, cannot be in future.
                      </FieldError>
                    ) : (
                      <Description className="text-muted mt-1.5 text-xs">
                        Select a range to dynamically query and filter the simulated system audit
                        logs.
                      </Description>
                    )}

                    <DateRangePicker.Popover className="border-border bg-surface flex max-w-sm flex-col gap-3 rounded-2xl border p-3 shadow-xl backdrop-blur-md">
                      <RangeCalendar aria-label="Query Range Calendar" className="w-full">
                        <RangeCalendar.Header>
                          <RangeCalendar.YearPickerTrigger>
                            <RangeCalendar.YearPickerTriggerHeading />
                            <RangeCalendar.YearPickerTriggerIndicator />
                          </RangeCalendar.YearPickerTrigger>
                          <RangeCalendar.NavButton slot="previous" />
                          <RangeCalendar.NavButton slot="next" />
                        </RangeCalendar.Header>
                        <RangeCalendar.Grid>
                          <RangeCalendar.GridHeader>
                            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                          </RangeCalendar.GridHeader>
                          <RangeCalendar.GridBody>
                            {(date) => <RangeCalendar.Cell date={date} />}
                          </RangeCalendar.GridBody>
                        </RangeCalendar.Grid>
                        <RangeCalendar.YearPickerGrid>
                          <RangeCalendar.YearPickerGridBody>
                            {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                          </RangeCalendar.YearPickerGridBody>
                        </RangeCalendar.YearPickerGrid>
                      </RangeCalendar>

                      {/* Render time-fields only when granularity includes time */}
                      {granularity !== "day" && (
                        <div className="border-border/60 flex flex-col gap-3 border-t pt-3">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-foreground/80 text-xs font-semibold">
                              Start Time
                            </span>
                            <TimeField
                              aria-label="Start Time"
                              granularity={granularity}
                              hideTimeZone={hideTimeZone}
                              hourCycle={hourCycle}
                              name="startTime"
                              shouldForceLeadingZeros={shouldForceLeadingZeros}
                              value={state.timeRange?.start ?? null}
                              onChange={(v) =>
                                state.setTimeRange({
                                  end: state.timeRange?.end as TimeValue,
                                  start: v as TimeValue,
                                })
                              }
                            >
                              <TimeField.Group variant="secondary">
                                <TimeField.Input>
                                  {(segment) => <TimeField.Segment segment={segment} />}
                                </TimeField.Input>
                              </TimeField.Group>
                            </TimeField>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-foreground/80 text-xs font-semibold">
                              End Time
                            </span>
                            <TimeField
                              aria-label="End Time"
                              granularity={granularity}
                              hideTimeZone={hideTimeZone}
                              hourCycle={hourCycle}
                              name="endTime"
                              shouldForceLeadingZeros={shouldForceLeadingZeros}
                              value={state.timeRange?.end ?? null}
                              onChange={(v) =>
                                state.setTimeRange({
                                  end: v as TimeValue,
                                  start: state.timeRange?.start as TimeValue,
                                })
                              }
                            >
                              <TimeField.Group variant="secondary">
                                <TimeField.Input>
                                  {(segment) => <TimeField.Segment segment={segment} />}
                                </TimeField.Input>
                              </TimeField.Group>
                            </TimeField>
                          </div>
                        </div>
                      )}

                      <div className="border-border/60 bg-surface-secondary mt-1 flex items-center justify-between rounded-xl border px-3 py-2">
                        <span className="text-muted text-[10px] font-bold tracking-wider uppercase">
                          Active Choice
                        </span>
                        <span className="text-accent font-mono text-xs font-bold select-none">
                          {state.value && state.value.start && state.value.end
                            ? formatDateRange({ end: state.value.end, start: state.value.start })
                            : "No selection"}
                        </span>
                      </div>
                    </DateRangePicker.Popover>
                  </>
                )}
              </DateRangePicker>
            </div>

            <Separator className="bg-border/60" />

            {/* Custom Formating Selectors */}
            <div className="flex flex-col gap-4">
              <h2 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
                <Icon icon="gravity-ui:gear" className="text-muted size-4" />
                3. Format & Settings
              </h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Granularity Select */}
                <Select
                  className="w-full"
                  value={granularity}
                  onChange={(val) => setGranularity(val as Granularity)}
                >
                  <Label>Granularity (精度)</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="day" textValue="Day">
                        Day (日)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="hour" textValue="Hour">
                        Hour (时)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="minute" textValue="Minute">
                        Minute (分)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="second" textValue="Second">
                        Second (秒)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                {/* HourCycle Select */}
                <Select
                  className="w-full"
                  value={hourCycle.toString()}
                  onChange={(val) => setHourCycle(Number(val) as HourCycle)}
                  isDisabled={granularity === "day"}
                >
                  <Label>Hour Cycle (小时制)</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="12" textValue="12-hour">
                        12-hour (12小时)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="24" textValue="24-hour">
                        24-hour (24小时)
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div className="flex flex-col gap-3.5 pt-1">
                {/* Switch 1: Hide Time Zone */}
                <Switch
                  isSelected={hideTimeZone}
                  onChange={setHideTimeZone}
                  isDisabled={granularity === "day"}
                >
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <div className="flex flex-col pl-1 text-left">
                      <span className="text-foreground text-xs font-semibold">Hide Timezone</span>
                      <span className="text-muted text-[10px]">
                        Toggle ISO timezone string visibility in inputs
                      </span>
                    </div>
                  </Switch.Content>
                </Switch>

                {/* Switch 2: Force Leading Zeros */}
                <Switch isSelected={shouldForceLeadingZeros} onChange={setShouldForceLeadingZeros}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <div className="flex flex-col pl-1 text-left">
                      <span className="text-foreground text-xs font-semibold">
                        Force Leading Zeros
                      </span>
                      <span className="text-muted text-[10px]">
                        Format single digit numbers (e.g. 9 to 09)
                      </span>
                    </div>
                  </Switch.Content>
                </Switch>

                {/* Switch 3: Strict Validation Mode */}
                <Switch isSelected={isValidationMode} onChange={setIsValidationMode}>
                  <Switch.Content>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <div className="flex flex-col pl-1 text-left">
                      <span className="text-foreground text-xs font-semibold">
                        Strict Validation
                      </span>
                      <span className="text-muted text-[10px]">
                        Enable custom safety constraints (&lt;30 days max)
                      </span>
                    </div>
                  </Switch.Content>
                </Switch>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Analytics Log Console */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Summary metrics widgets */}
          <div className="grid grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-surface border-border flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <span className="text-muted text-[9px] font-bold tracking-wider uppercase select-none">
                Total Logs
              </span>
              <span className="text-foreground mt-2 font-mono text-xl font-black tabular-nums">
                {isInvalid ? "--" : stats.total}
              </span>
            </div>

            {/* KPI 2 */}
            <div className="bg-surface border-border flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <span className="text-muted text-[9px] font-bold tracking-wider uppercase select-none">
                Error Rate
              </span>
              <span
                className={`mt-2 font-mono text-xl font-black tabular-nums ${stats.errorRate > 15 ? "text-danger animate-pulse" : "text-foreground"}`}
              >
                {isInvalid ? "--" : `${stats.errorRate}%`}
              </span>
            </div>

            {/* KPI 3 */}
            <div className="bg-surface border-border flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <span className="text-muted text-[9px] font-bold tracking-wider uppercase select-none">
                Avg Latency
              </span>
              <span className="text-foreground mt-2 font-mono text-xl font-black tabular-nums">
                {isInvalid ? "--" : `${stats.avgDuration}ms`}
              </span>
            </div>

            {/* KPI 4 */}
            <div className="bg-surface border-border flex flex-col justify-between rounded-xl border p-4 shadow-sm">
              <span className="text-muted text-[9px] font-bold tracking-wider uppercase select-none">
                Criticals
              </span>
              <span
                className={`mt-2 font-mono text-xl font-black tabular-nums ${stats.criticalAlerts > 0 ? "text-danger font-extrabold" : "text-foreground"}`}
              >
                {isInvalid ? "--" : stats.criticalAlerts}
              </span>
            </div>
          </div>

          {/* Audit Logs Console Box */}
          <div className="bg-surface border-border flex min-h-[460px] grow flex-col overflow-hidden rounded-2xl border shadow-sm">
            {/* Console Header */}
            <div className="border-border/60 bg-surface-secondary flex items-center justify-between border-b px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="bg-danger/15 text-danger size-2 animate-ping rounded-full" />
                <span className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Live System Audit Console
                </span>
              </div>
              {value && !isInvalid && (
                <span className="text-muted max-w-64 truncate font-mono text-[10px] tracking-tight select-none">
                  Query range: {formatDateRange(value)}
                </span>
              )}
            </div>

            {/* Console Messages List */}
            <div className="divide-border/40 flex max-h-[420px] grow flex-col divide-y overflow-y-auto">
              {isInvalid ? (
                <div className="flex grow flex-col items-center justify-center gap-2 p-12 text-center select-none">
                  <Icon
                    icon="gravity-ui:triangle-exclamation"
                    className="text-danger size-10 animate-bounce"
                  />
                  <p className="text-danger text-sm font-bold">Strict Validation Mode Triggered</p>
                  <p className="text-muted max-w-sm text-xs">
                    The requested query contains errors. Please ensure the start date is in the past
                    and does not exceed the 30 days gap limit.
                  </p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex grow flex-col items-center justify-center gap-2 p-12 text-center select-none">
                  <Icon icon="gravity-ui:terminal" className="text-muted size-9" />
                  <p className="text-muted text-sm font-semibold">
                    No Audit Logs In Selected Range
                  </p>
                  <p className="text-default-400 max-w-xs text-xs">
                    Try adjusting the Date Range Picker on the left or click the{" "}
                    <strong className="text-foreground">&quot;Last 30 Days&quot;</strong> shortcut
                    to view historical events.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const getSeverityColor = (sev: typeof log.severity) => {
                    switch (sev) {
                      case "info":
                        return "success";
                      case "warning":
                        return "warning";
                      case "error":
                        return "danger";
                      case "critical":
                        return "danger";
                      default:
                        return "default";
                    }
                  };

                  const getCategoryIcon = (cat: typeof log.category) => {
                    switch (cat) {
                      case "Security":
                        return "gravity-ui:shield-keyhole";
                      case "API":
                        return "gravity-ui:link";
                      case "Database":
                        return "gravity-ui:database";
                      case "System":
                        return "gravity-ui:nodes-down";
                      default:
                        return "gravity-ui:terminal";
                    }
                  };

                  return (
                    <div
                      key={log.id}
                      className="hover:bg-default-50/5 flex flex-col gap-3 p-4 transition-colors md:flex-row md:items-start"
                    >
                      {/* Left: Indicator icons */}
                      <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-center">
                        <Tooltip delay={0}>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={getSeverityColor(log.severity)}
                            className="scale-90 font-semibold tracking-wider uppercase"
                          >
                            {log.severity}
                          </Chip>
                          <Tooltip.Content>Severity level: {log.severity}</Tooltip.Content>
                        </Tooltip>

                        <div className="text-muted border-border bg-surface-secondary flex items-center justify-center rounded-lg border p-1">
                          <Icon icon={getCategoryIcon(log.category)} className="size-3.5" />
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-foreground/90 font-mono font-bold select-none">
                            {log.id}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="bg-default-100/5 text-muted rounded px-1.5 py-0.5 font-mono text-[10px]">
                            {log.category}
                          </span>
                          <span className="text-muted">•</span>
                          <span className="text-muted font-mono tabular-nums">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-foreground text-sm leading-relaxed leading-snug font-medium">
                          {log.message}
                        </p>
                        <div className="text-muted flex items-center gap-1.5 text-xs">
                          <span>Operator:</span>
                          <span className="text-foreground font-semibold">@{log.operator}</span>
                        </div>
                      </div>

                      {/* Right: Performance latency */}
                      <div className="text-muted flex shrink-0 items-center gap-1 self-end font-mono text-xs md:flex-col md:items-end md:self-start">
                        <Icon icon="gravity-ui:gauge" className="size-3" />
                        <span className="font-bold tabular-nums">{log.durationMs}ms</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Console Footer */}
            <div className="border-border/60 bg-surface-secondary text-muted flex items-center justify-between border-t px-5 py-2 text-[10px] select-none">
              <span>Total registered system logs: {MOCK_AUDIT_LOGS.length} events</span>
              <span>Odyssey System Engine v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
