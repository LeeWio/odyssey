"use client";

import { pageEaseOut } from "@/lib/motion";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { CalendarDateTime } from "@internationalized/date";
import { Chip, Typography } from "@heroui/react";
import { Agenda, useAgenda, type AgendaEventType } from "@heroui-pro/react";
import { PageFrame } from "@/components/layout/page-frame";
let nextId = 100;

export function SchedulePage() {
  const [events, setEvents] = useState<AgendaEventType[]>([]);

  const handleCreate = useCallback(
    (newEvent: { start: CalendarDateTime; end: CalendarDateTime }) => {
      const id = String(nextId++);
      const color = "var(--accent)";

      setEvents((prev) => [
        ...prev,
        { color, end: newEvent.end, id, start: newEvent.start, title: "一件事" },
      ]);
    },
    []
  );

  const handleMove = useCallback((id: string, start: CalendarDateTime, end: CalendarDateTime) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, end, start } : e)));
  }, []);

  const handleResize = useCallback((id: string, start: CalendarDateTime, end: CalendarDateTime) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, end, start } : e)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const agenda = useAgenda({
    defaultView: "week",
    events,
    onEventCreate: handleCreate,
    onEventDelete: handleDelete,
    onEventMove: handleMove,
    onEventResize: handleResize,
    weekDays: 7,
  });

  return (
    <PageFrame className="bg-background">
      <div className="flex w-full flex-col gap-8">
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: pageEaseOut }}
          className="max-w-xl"
        >
          <Chip color="accent" size="sm" variant="soft">
            只在这台浏览器里
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.045em] text-balance"
          >
            这周的空格
          </Typography>
          <Typography color="muted" type="body" className="mt-4 leading-7">
            拖一块出来，就是一件事。刷新就没了，没有同步到任何日历。
          </Typography>
        </motion.header>

        {/* Agenda Scheduling Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: pageEaseOut }}
          className="border-separator bg-surface-secondary/40 h-[72vh] min-h-[36rem] w-full overflow-hidden rounded-3xl border p-4 md:p-6"
        >
          <Agenda {...agenda}>
            <Agenda.Header className="border-default-100 mb-4 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <Agenda.Heading className="text-foreground text-lg font-bold" />
              <div className="flex flex-wrap items-center gap-3">
                <Agenda.ViewSelector size="sm" />
                <Agenda.Navigation className="flex items-center gap-1.5">
                  <Agenda.NavButton slot="previous" />
                  <Agenda.TodayButton />
                  <Agenda.NavButton slot="next" />
                </Agenda.Navigation>
              </div>
            </Agenda.Header>

            <Agenda.Body>
              {agenda.view !== "month" ? (
                <>
                  <Agenda.WeekHeader />
                  <Agenda.AllDaySection>
                    {agenda.allDayLayout.map((item) => (
                      <Agenda.AllDayEvent
                        key={item.event.id}
                        colSpan={item.colSpan}
                        colStart={item.colStart}
                        event={item.event}
                        row={item.row}
                      />
                    ))}
                  </Agenda.AllDaySection>
                  <Agenda.TimeGrid>
                    <Agenda.CurrentTimeIndicator />
                    {agenda.visibleDays.map((day) => (
                      <Agenda.DayColumn key={day.toString()} date={day}>
                        {agenda.getEventsForDay(day).map((event) => (
                          <Agenda.Event key={event.id} event={event} />
                        ))}
                      </Agenda.DayColumn>
                    ))}
                  </Agenda.TimeGrid>
                </>
              ) : (
                <Agenda.MonthGrid>
                  {agenda.visibleWeeks.map((week, i) => {
                    const rowLayout = agenda.getMonthRowLayout(week);

                    return (
                      <Agenda.MonthRow key={i} spanningRowCount={rowLayout.rowCount}>
                        {rowLayout.items.map((item) => (
                          <Agenda.MonthSpanningEvent
                            key={item.event.id}
                            colSpan={item.colSpan}
                            colStart={item.colStart}
                            event={item.event}
                            row={item.row}
                          />
                        ))}
                        {week.map((day, colIdx) => (
                          <Agenda.MonthCell
                            key={day.toString()}
                            date={day}
                            maxEvents={2}
                            spanningRowCount={rowLayout.rowCountPerCol[colIdx] ?? 0}
                          >
                            {agenda.getPerCellEvents(day, week).map((event) => (
                              <Agenda.MonthEvent key={event.id} event={event} />
                            ))}
                          </Agenda.MonthCell>
                        ))}
                      </Agenda.MonthRow>
                    );
                  })}
                </Agenda.MonthGrid>
              )}
            </Agenda.Body>
          </Agenda>
        </motion.div>
      </div>
    </PageFrame>
  );
}
