"use client";

import {
  ArrowRight,
  Calendar as CalendarIcon,
  CircleExclamation,
  FileText,
  Sparkles,
} from "@gravity-ui/icons";
import { CalendarDate, getLocalTimeZone, startOfMonth, today } from "@internationalized/date";
import { Button, Calendar, Card, Chip, Link, Skeleton, Typography } from "@heroui/react";
import { EmptyState, Widget } from "@heroui-pro/react";
import { useMemo, useState } from "react";
import {
  type EditorialCalendarResponse,
  useGetEditorialCalendarQuery,
} from "@/lib/features/dashboard";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "In review",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

function toIsoDate(date: CalendarDate) {
  return date.toString();
}

function monthRange(date: CalendarDate) {
  const monthStart = startOfMonth(date);

  return {
    from: toIsoDate(monthStart),
    to: toIsoDate(monthStart.add({ months: 1 }).subtract({ days: 1 })),
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", weekday: "long" }).format(
    new Date(`${date}T12:00:00`)
  );
}

function entryIcon(type: EditorialCalendarResponse["entries"][number]["type"]) {
  return type === "MOMENT" ? Sparkles : FileText;
}

function entryLabel(type: EditorialCalendarResponse["entries"][number]["type"]) {
  return type === "MOMENT" ? "Moment" : "Article";
}

export function EditorialCalendarPage() {
  const initialDate = today(getLocalTimeZone());
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(initialDate);
  const [focusedDate, setFocusedDate] = useState<CalendarDate>(initialDate);
  const range = useMemo(() => monthRange(focusedDate), [focusedDate]);
  const { data, isError, isFetching, isLoading, refetch } = useGetEditorialCalendarQuery(range);
  const selectedEntries = useMemo(
    () => data?.entries.filter((entry) => entry.date === selectedDate.toString()) ?? [],
    [data?.entries, selectedDate]
  );

  const handleToday = () => {
    const nextDate = today(getLocalTimeZone());

    setSelectedDate(nextDate);
    setFocusedDate(nextDate);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 pt-8 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Chip className="w-fit" color="accent" size="sm" variant="soft">
            Editorial planning
          </Chip>
          <div>
            <Typography type="h1" weight="bold" className="text-3xl tracking-[-0.04em]">
              Schedule
            </Typography>
            <Typography type="body" color="muted" className="mt-2 max-w-xl">
              See what is published, what is next, and where the rhythm of your work is changing.
            </Typography>
          </div>
        </div>
        <Button onPress={handleToday} variant="tertiary">
          <CalendarIcon className="size-4" />
          Today
        </Button>
      </header>

      {isError ? (
        <EmptyState className="bg-surface-secondary w-full rounded-2xl">
          <EmptyState.Header>
            <EmptyState.Media variant="icon">
              <CircleExclamation />
            </EmptyState.Media>
            <EmptyState.Title>Schedule is unavailable</EmptyState.Title>
            <EmptyState.Description>
              We could not load the editorial rhythm for this month. Your content is safe.
            </EmptyState.Description>
          </EmptyState.Header>
          <EmptyState.Content>
            <Button onPress={() => void refetch()} variant="secondary">
              Try again
            </Button>
          </EmptyState.Content>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.5fr)]">
          <Widget>
            <Widget.Header>
              <div>
                <Widget.Title>Editorial calendar</Widget.Title>
                <Widget.Description>Choose a day to inspect its story</Widget.Description>
              </div>
              <Chip color="accent" size="sm" variant="soft">
                {data?.entries.length ?? 0} items
              </Chip>
            </Widget.Header>
            <Widget.Content className="flex justify-center">
              <Calendar
                aria-label="Editorial calendar"
                focusedValue={focusedDate}
                firstDayOfWeek="mon"
                value={selectedDate}
                weeksInMonth={6}
                onChange={(value) => setSelectedDate(value)}
                onFocusChange={(value) => setFocusedDate(value as CalendarDate)}
              >
                <Calendar.Header>
                  <Calendar.Heading />
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>
                    {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                  </Calendar.GridHeader>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
              </Calendar>
            </Widget.Content>
          </Widget>

          <Widget>
            <Widget.Header>
              <div>
                <Widget.Title>{formatDate(selectedDate.toString())}</Widget.Title>
                <Widget.Description>
                  {isFetching ? "Refreshing this month" : "The content planned for this day"}
                </Widget.Description>
              </div>
              <Chip color="default" size="sm" variant="soft">
                {selectedEntries.length} {selectedEntries.length === 1 ? "entry" : "entries"}
              </Chip>
            </Widget.Header>
            <Widget.Content className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton className="h-24 rounded-xl" key={item} />
                  ))}
                </div>
              ) : selectedEntries.length === 0 ? (
                <EmptyState size="sm">
                  <EmptyState.Header>
                    <EmptyState.Media variant="icon">
                      <CalendarIcon />
                    </EmptyState.Media>
                    <EmptyState.Title>A quiet day</EmptyState.Title>
                    <EmptyState.Description>
                      Nothing is planned here yet. That can be intentional too.
                    </EmptyState.Description>
                  </EmptyState.Header>
                </EmptyState>
              ) : (
                selectedEntries.map((entry) => {
                  const Icon = entryIcon(entry.type);

                  return (
                    <Link className="group no-underline" href={entry.href} key={entry.id}>
                      <Card className="group-hover:bg-surface-secondary transition-colors">
                        <Card.Header className="flex-row items-start gap-3">
                          <div className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-xl">
                            <Icon className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Card.Title className="text-sm">{entry.title}</Card.Title>
                              <Chip
                                color={entry.type === "MOMENT" ? "warning" : "accent"}
                                size="sm"
                                variant="soft"
                              >
                                {entryLabel(entry.type)}
                              </Chip>
                            </div>
                            <Card.Description className="mt-1">
                              {entry.status ? STATUS_LABELS[entry.status] : "Published moment"}
                              <span aria-hidden="true"> · </span>
                              {new Intl.DateTimeFormat("en", {
                                hour: "numeric",
                                minute: "2-digit",
                              }).format(new Date(entry.timestamp))}
                            </Card.Description>
                          </div>
                          <ArrowRight className="text-muted mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </Card.Header>
                      </Card>
                    </Link>
                  );
                })
              )}
            </Widget.Content>
          </Widget>
        </div>
      )}
    </div>
  );
}
