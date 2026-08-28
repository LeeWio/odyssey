"use client";

import React from "react";
import { Avatar, Card, Skeleton, Typography } from "@heroui/react";
import { RichTextEditor } from "@heroui-pro/react";
import { useMediaQuery } from "@mantine/hooks";
import { motion } from "motion/react";
import { useRelativeTime } from "@/lib/relative-time";
import type { MomentResponse } from "@/lib/features/moment";
import { isDocumentEmpty, parseMomentContent } from "@/features/moment/utils/content-parser";
import ScrollingBanner from "@/components/corners/scrolling-banner";

type MomentBoardEntry = {
  avatar: string;
  name: string;
  timeLabel: string;
  content: MomentResponse["content"];
};

function MomentsBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
        className="shadow-small flex w-full max-w-full min-w-0 origin-center cursor-pointer flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 hover:scale-[1.02]"
      >
        <Card.Header className="flex w-full flex-row items-center justify-between">
          <div className="flex min-w-0 flex-row items-center gap-2">
            <Avatar>
              <Avatar.Image alt={entry.name} src={entry.avatar} />
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
            <RichTextEditor isReadOnly defaultValue={parsedContent} className="w-full min-w-0">
              <RichTextEditor.Shell className="h-auto max-h-36 min-h-0 w-full min-w-0 overflow-hidden rounded-none border-none bg-transparent p-0 shadow-none outline-none">
                <RichTextEditor.Content className="text-muted h-auto min-h-0 bg-transparent text-sm leading-6 outline-none focus:outline-none [&_.ProseMirror]:h-auto [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:p-0 [&_.ProseMirror]:break-all [&_.ProseMirror_*]:max-w-full [&_.ProseMirror_p]:break-all" />
              </RichTextEditor.Shell>
            </RichTextEditor>
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

  const entries = React.useMemo<MomentBoardEntry[]>(
    () =>
      moments.map((moment) => ({
        avatar: moment.authorAvatar || `https://i.pravatar.cc/150?u=moment-${moment.id}`,
        name: moment.authorName || "wei.li",
        timeLabel: formatRelativeTime(moment.createdAt),
        content: moment.content,
      })),
    [moments, formatRelativeTime]
  );

  const columns = React.useMemo(() => {
    const nextColumns: MomentBoardEntry[][] = [[], [], [], []];
    entries.forEach((entry, index) => nextColumns[index % 4].push(entry));
    return nextColumns;
  }, [entries]);

  if (isLoading && entries.length === 0) return <MomentsBoardSkeleton />;

  const firstColumn = isMobile ? entries : columns[0];

  return (
    <div className="w-full">
      <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
        {[firstColumn, columns[1], columns[2], columns[3]].map((column, index) => (
          <ScrollingBanner
            key={index}
            isVertical
            className={
              index === 0
                ? "w-full min-w-0"
                : index === 1
                  ? "hidden w-full min-w-0 sm:flex"
                  : index === 2
                    ? "hidden w-full min-w-0 md:flex"
                    : "hidden w-full min-w-0 lg:flex"
            }
            duration={isMobile ? 200 : 150}
            shouldPauseOnHover
          >
            {column.map((entry, entryIndex) => (
              <MomentBoardCard
                key={`${entry.name}-${entryIndex}`}
                entry={entry}
                index={entryIndex}
              />
            ))}
          </ScrollingBanner>
        ))}
      </div>
    </div>
  );
}
