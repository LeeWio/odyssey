"use client";

import React from "react";
import { useMediaQuery } from "@mantine/hooks";
import { useGetGuestbookEntriesQuery } from "@/lib/features/comment";
import { useTranslations } from "next-intl";
import { useRelativeTime } from "@/lib/relative-time";
import ScrollingBanner from "./scrolling-banner";
import GuestbookCard from "./guestbook-card";
import { splitIntoColumns, useScrollColumnCount } from "./use-scroll-column-count";

type GuestbookEntry = {
  avatar?: string | null;
  name: string;
  role: string;
  content: string;
};

const defaultEntries: GuestbookEntry[] = [
  {
    name: "Arthur Vance",
    role: "Systems Designer",
    content:
      "Odyssey has helped me rethink how I document my work. The combination of quiet observation and real-time telemetry is a beautiful standard.",
  },
  {
    name: "Clara Chen",
    role: "Creative Technologist",
    content:
      "I was amazed by the smooth performance. Normally, combining complex WebGL canvases, GSAP scroll triggers, and rich-text systems causes significant lag, but here, it runs at an effortless 120fps. Absolute masterclass in engineering! 🔥",
  },
  {
    name: "S. Morrison",
    role: "Creative Writer",
    content:
      "The minimalist editorial layouts and generous whitespace have streamlined my reading experience. It feels more like a physical book than a browser tab.",
  },
  {
    name: "Michael Wood",
    role: "Frontend Architect",
    content:
      "A living archive that breathes. The typography hierarchy, tabular numerals, and custom spring motion curves show an elite level of craft.",
  },
  {
    name: "Linda Davis",
    role: "Digital Curator",
    content:
      "I love the creative freedom. The rich comment system and the physical constellations background make it feel like a cozy, infinite workspace.",
  },
  {
    name: "Diana Prince",
    role: "Quantitative Analyst",
    content:
      "The real-time NASDAQ signal is a lovely touch. Calming technology at its absolute finest. High information density without the anxiety.",
  },
  {
    name: "Marcus Aurelius",
    role: "Backend Engineer",
    content:
      "A reminder that 'the unfinished work matters.' Bookmarking the design guidelines as a reference for my own team's engineering standards.",
  },
  {
    name: "Susan Wilson",
    role: "Product Designer",
    content:
      "The Tiptap editor and smooth slash command palettes feel so premium. It's the ideal fusion of a clean developer portfolio and a raw creative canvas.",
  },
  {
    name: "Mila Vance",
    role: "Music Curator",
    content:
      "Currently listening to '老歌' too! It's incredibly comforting to see someone share their music queue as a real-time signal of their mood.",
  },
  {
    name: "Hiroshi Tanaka",
    role: "Developer",
    content:
      "Seeing these active focus metrics makes me want to build my own deep work tracker. Such an elegant way to display personal telemetry.",
  },
  {
    name: "Chloe Sterling",
    role: "Creative Director",
    content:
      "The constellations background is mesmerizing. I caught myself staring at it for five minutes straight. Beautiful design engineering.",
  },
  {
    name: "David Wilson",
    role: "CTO",
    content:
      "A system that begins to hold. It is in the refactoring of those quiet margins where we find the real joy of building software.",
  },
];

export default function GuestbookBoard() {
  const t = useTranslations("Guestbook");
  const formatRelativeTime = useRelativeTime();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { ref: boardRef, columnCount } = useScrollColumnCount<HTMLDivElement>();
  const { data: rawEntries = [] } = useGetGuestbookEntriesQuery();

  const mappedEntries = React.useMemo(() => {
    const live = (rawEntries || []).map((comment) => ({
      avatar: comment.avatar || null,
      name: comment.nickname || comment.username || t("anonymous"),
      role: t("explorer", { time: formatRelativeTime(comment.createdAt) }),
      content: comment.content,
    }));

    // Prepend live entries to the default entries to ensure scroll banner has enough items
    return [...live, ...defaultEntries];
  }, [rawEntries, formatRelativeTime, t]);

  const columns = React.useMemo(
    () => splitIntoColumns(mappedEntries, columnCount),
    [mappedEntries, columnCount]
  );

  return (
    <div ref={boardRef} className="w-full py-10">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
      >
        {columns.map((column, columnIndex) => (
          <ScrollingBanner
            key={columnIndex}
            isVertical
            duration={isMobile ? 200 : columnIndex % 2 === 0 ? 120 : 200}
            shouldPauseOnHover={true}
          >
            {column.map((testimonial, index) => (
              <GuestbookCard
                key={`${testimonial.name}-${columnIndex}-${index}`}
                index={index}
                {...testimonial}
              />
            ))}
          </ScrollingBanner>
        ))}
      </div>
    </div>
  );
}
