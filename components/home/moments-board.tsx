"use client";

import React from "react";
import { Avatar, Card, Skeleton, Typography } from "@heroui/react";
import { useMediaQuery } from "@mantine/hooks";
import { motion } from "motion/react";
import { useRelativeTime } from "@/lib/relative-time";
import type { MomentResponse } from "@/lib/features/moment";
import { isDocumentEmpty, parseMomentContent } from "@/features/moment/utils/content-parser";
import { MomentContent } from "@/features/moment/components/moment-content";
import ScrollingBanner from "@/components/corners/scrolling-banner";
import {
  splitIntoColumns,
  useScrollColumnCount,
} from "@/components/corners/use-scroll-column-count";

type MomentBoardEntry = {
  avatar?: string | null;
  name: string;
  timeLabel: string;
  content: MomentResponse["content"];
};

function MomentsBoardSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Card key={index} variant="secondary" className="flex min-h-36 flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-5/6 rounded-md" />
        </Card>
      ))}
    </div>
  );
}

function MomentBoardCard({ entry, index }: { entry: MomentBoardEntry; index: number }) {
  const parsedContent = parseMomentContent(entry.content);
  const fallbackInitials = entry.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="w-full max-w-full min-w-0"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Card
        variant="default"
        className="shadow-small hover:shadow-medium flex w-full max-w-full min-w-0 origin-center cursor-pointer flex-col overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5"
      >
        <Card.Header className="flex w-full flex-row items-center justify-between">
          <div className="flex min-w-0 flex-row items-center gap-2">
            <Avatar size="sm">
              {entry.avatar ? <Avatar.Image alt={entry.name} src={entry.avatar} /> : null}
              <Avatar.Fallback>{fallbackInitials}</Avatar.Fallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <Typography className="leading-none" weight="bold" truncate align="start" type="body">
                {entry.name}
              </Typography>
              <Typography truncate align="start" type="body-xs" color="muted">
                {entry.timeLabel}
              </Typography>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="min-w-0 overflow-hidden">
          {isDocumentEmpty(parsedContent) ? (
            <Typography color="muted" type="body-sm">
              A quiet note from lately.
            </Typography>
          ) : (
            <MomentContent content={parsedContent} className="text-muted line-clamp-5" />
          )}
        </Card.Content>
      </Card>
    </motion.div>
  );
}

export function MomentsBoard({
  moments,
  isLoading,
}: {
  moments: MomentResponse[];
  isLoading: boolean;
}) {
  const formatRelativeTime = useRelativeTime();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { ref: boardRef, columnCount } = useScrollColumnCount<HTMLDivElement>();

  const entries = React.useMemo<MomentBoardEntry[]>(
    () =>
      moments.map((moment) => ({
        avatar: moment.authorAvatar || null,
        name: moment.authorName || "wei.li",
        timeLabel: formatRelativeTime(moment.createdAt),
        content: moment.content,
      })),
    [moments, formatRelativeTime]
  );

  const columns = React.useMemo(() => {
    // Keep at least three cards per column so the duplicated scrolling track stays
    // taller than its viewport, even when the API has only a handful of recent moments.
    return splitIntoColumns(entries, columnCount).map((column) => {
      const source = column.length > 0 ? column : entries;
      if (source.length === 0) return column;

      return Array.from(
        { length: Math.max(3, column.length) },
        (_, index) => source[index % source.length]
      );
    });
  }, [columnCount, entries]);

  if (isLoading && entries.length === 0) return <MomentsBoardSkeleton />;

  return (
    <div ref={boardRef} className="w-full py-10">
      <div
        className="grid gap-4 px-1"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {columns.map((column, columnIndex) => (
          <ScrollingBanner
            key={columnIndex}
            isVertical
            duration={columnIndex % 2 === 0 ? (isMobile ? 200 : 120) : 200}
            shouldPauseOnHover={true}
          >
            {column.map((entry, index) => (
              <MomentBoardCard
                key={`${entry.name}-${columnIndex}-${index}`}
                entry={entry}
                index={index}
              />
            ))}
          </ScrollingBanner>
        ))}
      </div>
    </div>
  );
}
