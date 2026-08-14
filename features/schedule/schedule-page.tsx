"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { CalendarDateTime } from "@internationalized/date";
import { Chip, Typography } from "@heroui/react";
import { Agenda, useAgenda, type AgendaEventType } from "@heroui-pro/react";
import { Calendar } from "lucide-react";

const easeOut = [0.22, 1, 0.36, 1] as const;

function generateSeedEvents(): AgendaEventType[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();

  const dt = (year: number, month: number, day: number, hour: number, minute = 0) => {
    return new CalendarDateTime(year, month, day, hour, minute);
  };

  return [
    {
      color: "#10b981",
      end: dt(y, m, d + 1, 23, 59),
      id: "allday-1",
      isAllDay: true,
      start: dt(y, m, d, 0),
      title: "Hasselblad Darkroom Lab",
    },
    {
      color: "#3b82f6",
      end: dt(y, m, d, 9, 30),
      id: "1",
      start: dt(y, m, d, 9, 0),
      title: "Team Standup",
    },
    {
      color: "#8b5cf6",
      end: dt(y, m, d, 12, 0),
      id: "2",
      start: dt(y, m, d, 10, 0),
      title: "Deep Focus: R3F Galaxy Shaders",
    },
    {
      color: "#d946ef",
      end: dt(y, m, d, 13, 0),
      id: "3",
      start: dt(y, m, d, 12, 0),
      title: "Lunch with Design Partners",
    },
    {
      color: "#3b82f6",
      end: dt(y, m, d, 15, 30),
      id: "4",
      start: dt(y, m, d, 14, 0),
      title: "Design Review: HeroUI AI Components",
    },
    {
      color: "#10b981",
      end: dt(y, m, d, 16, 30),
      id: "5",
      start: dt(y, m, d, 16, 0),
      title: "1:1 with Tech Architect",
    },
    {
      color: "#f59e0b",
      end: dt(y, m, d + 1, 12, 0),
      id: "6",
      start: dt(y, m, d + 1, 10, 0),
      title: "Eurorack Synthesizer Recording",
    },
    {
      color: "#06b6d4",
      end: dt(y, m, d + 2, 11, 30),
      id: "7",
      start: dt(y, m, d + 2, 9, 30),
      title: "Code Review & Refactoring",
    },
  ];
}

const EVENT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#d946ef", "#8b5cf6", "#ef4444", "#06b6d4"];
let nextId = 100;

export function SchedulePage() {
  const seedEvents = useMemo(() => generateSeedEvents(), []);
  const [events, setEvents] = useState<AgendaEventType[]>(seedEvents);

  const handleCreate = useCallback(
    (newEvent: { start: CalendarDateTime; end: CalendarDateTime }) => {
      const id = String(nextId++);
      const color = EVENT_COLORS[nextId % EVENT_COLORS.length];

      setEvents((prev) => [
        ...prev,
        { color, end: newEvent.end, id, start: newEvent.start, title: "New Task" },
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
    <div className="bg-background min-h-[100dvh] w-full px-6 pt-28 pb-24 sm:px-10 lg:pt-32">
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="border-default-200/50 mb-10 flex flex-col items-center border-b pb-8 text-center"
        >
          <Chip color="accent" size="sm" variant="soft" className="gap-1.5 pl-2">
            <Calendar className="text-accent size-3" />
            Interactive Scheduler
          </Chip>
          <Typography
            type="h1"
            weight="bold"
            className="mt-4 text-4xl leading-tight text-balance sm:text-5xl"
          >
            Daily Focus & Agenda
          </Typography>
          <Typography color="muted" type="body" className="mt-4 max-w-xl leading-relaxed">
            Drag to create, move, or resize schedule blocks. Coordinate your visual engineering
            timelines dynamically.
          </Typography>
        </motion.header>

        {/* Agenda Scheduling Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
          className="border-default-200 bg-surface-secondary/40 overflow-hidden rounded-3xl border p-4 shadow-sm md:p-6"
          style={{ height: 680, width: "100%" }}
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
    </div>
  );
}
