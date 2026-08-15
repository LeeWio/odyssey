"use client";

import React from "react";
import { useMediaQuery } from "@mantine/hooks";
import { Card, Skeleton } from "@heroui/react";

import { useGetGuestbookEntriesQuery } from "@/lib/features/comment";
import { formatRelativeTime } from "@/lib/relative-time";
import ScrollingBanner from "./scrolling-banner";
import GuestbookCard from "./guestbook-card";

type GuestbookEntry = {
  avatar: string;
  name: string;
  role: string;
  content: string;
};

const defaultEntries: GuestbookEntry[] = [
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    name: "Arthur Vance",
    role: "Systems Designer",
    content:
      "Odyssey has helped me rethink how I document my work. The combination of quiet observation and real-time telemetry is a beautiful standard.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024e",
    name: "Clara Chen",
    role: "Creative Technologist",
    content:
      "I was amazed by the smooth performance. Normally, combining complex WebGL canvases, GSAP scroll triggers, and rich-text systems causes significant lag, but here, it runs at an effortless 120fps. Absolute masterclass in engineering! 🔥",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260250",
    name: "S. Morrison",
    role: "Creative Writer",
    content:
      "The minimalist editorial layouts and generous whitespace have streamlined my reading experience. It feels more like a physical book than a browser tab.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260251",
    name: "Michael Wood",
    role: "Frontend Architect",
    content:
      "A living archive that breathes. The typography hierarchy, tabular numerals, and custom spring motion curves show an elite level of craft.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260252",
    name: "Linda Davis",
    role: "Digital Curator",
    content:
      "I love the creative freedom. The rich comment system and the physical constellations background make it feel like a cozy, infinite workspace.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260253",
    name: "Diana Prince",
    role: "Quantitative Analyst",
    content:
      "The real-time NASDAQ signal is a lovely touch. Calming technology at its absolute finest. High information density without the anxiety.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260254",
    name: "Marcus Aurelius",
    role: "Backend Engineer",
    content:
      "A reminder that 'the unfinished work matters.' Bookmarking the design guidelines as a reference for my own team's engineering standards.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260255",
    name: "Susan Wilson",
    role: "Product Designer",
    content:
      "The Tiptap editor and smooth slash command palettes feel so premium. It's the ideal fusion of a clean developer portfolio and a raw creative canvas.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260256",
    name: "Mila Vance",
    role: "Music Curator",
    content:
      "Currently listening to '老歌' too! It's incredibly comforting to see someone share their music queue as a real-time signal of their mood.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260257",
    name: "Hiroshi Tanaka",
    role: "Developer",
    content:
      "Seeing these active focus metrics makes me want to build my own deep work tracker. Such an elegant way to display personal telemetry.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260258",
    name: "Chloe Sterling",
    role: "Creative Director",
    content:
      "The constellations background is mesmerizing. I caught myself staring at it for five minutes straight. Beautiful design engineering.",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=a042581f4e290260259",
    name: "David Wilson",
    role: "CTO",
    content:
      "A system that begins to hold. It is in the refactoring of those quiet margins where we find the real joy of building software.",
  },
];

function GuestbookSkeletonCard() {
  return (
    <Card className="border-default-100/50 bg-surface-secondary/10 flex w-full flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-5/6 rounded-md" />
      </div>
    </Card>
  );
}

export default function GuestbookBoard() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { data: rawEntries = [], isLoading } = useGetGuestbookEntriesQuery();

  const mappedEntries = React.useMemo(() => {
    const live = (rawEntries || []).map((comment) => ({
      avatar: comment.avatar || `https://i.pravatar.cc/150?u=${comment.id}`,
      name: comment.nickname || comment.username || "Anonymous",
      role: `Explorer · ${formatRelativeTime(comment.createdAt)}`,
      content: comment.content,
    }));

    // Prepend live entries to the default entries to ensure scroll banner has enough items
    return [...live, ...defaultEntries];
  }, [rawEntries]);

  const columns = React.useMemo(() => {
    const cols: GuestbookEntry[][] = [[], [], [], []];
    mappedEntries.forEach((entry, idx) => {
      cols[idx % 4].push(entry);
    });
    return cols;
  }, [mappedEntries]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <GuestbookSkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  const firstColumn = isMobile ? mappedEntries : columns[0];
  const secondColumn = columns[1];
  const thirdColumn = columns[2];
  const fourthColumn = columns[3];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="columns-1 gap-4 sm:columns-2 md:columns-3 lg:columns-4">
        <ScrollingBanner isVertical duration={isMobile ? 200 : 120} shouldPauseOnHover={true}>
          {firstColumn.map((testimonial, index) => (
            <GuestbookCard key={`${testimonial.name}-${index}`} index={index} {...testimonial} />
          ))}
        </ScrollingBanner>
        <ScrollingBanner
          isVertical
          className="hidden sm:flex"
          duration={200}
          shouldPauseOnHover={true}
        >
          {secondColumn.map((testimonial, index) => (
            <GuestbookCard key={`${testimonial.name}-${index}`} index={index} {...testimonial} />
          ))}
        </ScrollingBanner>
        <ScrollingBanner
          isVertical
          className="hidden md:flex"
          duration={200}
          shouldPauseOnHover={true}
        >
          {thirdColumn.map((testimonial, index) => (
            <GuestbookCard key={`${testimonial.name}-${index}`} index={index} {...testimonial} />
          ))}
        </ScrollingBanner>
        <ScrollingBanner
          isVertical
          className="hidden lg:flex"
          duration={200}
          shouldPauseOnHover={true}
        >
          {fourthColumn.map((testimonial, index) => (
            <GuestbookCard key={`${testimonial.name}-${index}`} index={index} {...testimonial} />
          ))}
        </ScrollingBanner>
      </div>
    </div>
  );
}
