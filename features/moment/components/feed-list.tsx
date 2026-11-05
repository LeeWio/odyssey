"use client";

import { AnimatePresence, motion, useAnimationControls, useIsPresent } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";

import type { MomentResponse } from "@/lib/features/moment";
import { pageEaseOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { MomentCard } from "./card";
import { momentLayoutTransition, useMomentMotion } from "./feed-motion";

function MomentFeedItem({
  id,
  targeted,
  entranceOrder,
  enteredMomentIds,
  children,
}: {
  id: number;
  targeted: boolean;
  entranceOrder: number;
  enteredMomentIds: Set<number>;
  children: ReactNode;
}) {
  const { reduced } = useMomentMotion();
  const present = useIsPresent();
  const controls = useAnimationControls();
  const [entrance] = useState(() => ({ play: !enteredMomentIds.has(id), order: entranceOrder }));

  useLayoutEffect(() => {
    // Read the live preference before paint; the shared SSR-safe hook starts reduced.
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Boolean(window.location.hash);
    enteredMomentIds.add(id);
    if (!entrance.play || skip) {
      controls.set({ opacity: 1, y: 0 });
      return;
    }
    controls.set({ opacity: 0, y: 16 });
    void controls.start({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: entrance.order * 0.16,
        ease: pageEaseOut,
      },
    });
    return () => controls.stop();
  }, [controls, enteredMomentIds, entrance, id]);

  useEffect(() => {
    if (!reduced || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    controls.stop();
    controls.set({ opacity: 1, y: 0 });
  }, [controls, reduced]);

  return (
    <motion.li
      id={`moment-${id}`}
      tabIndex={-1}
      data-moment-target={targeted}
      layout
      inert={!present ? true : undefined}
      aria-hidden={!present ? true : undefined}
      className={cn(
        "focus-visible:ring-accent relative mb-6 flow-root w-full min-w-0 scroll-mt-28 break-inside-avoid rounded-lg outline-none focus-visible:ring-2 @min-[41rem]/moment-feed:group-data-[view=grid]/moment-feed:mb-4",
        entrance.play && "[@media(scripting:enabled)]:motion-safe:opacity-0"
      )}
      initial={false}
      animate={controls}
      onFocusCapture={() => {
        controls.stop();
        controls.set({ opacity: 1, y: 0 });
      }}
      exit={{ opacity: 0, transition: { duration: reduced ? 0 : 0.14, delay: 0 } }}
      transition={{
        duration: reduced ? 0 : 0.2,
        ease: pageEaseOut,
        layout: reduced ? { duration: 0 } : momentLayoutTransition,
      }}
    >
      {targeted ? (
        <motion.span
          aria-hidden="true"
          className="ring-accent pointer-events-none absolute inset-0 rounded-lg ring-2"
          initial={false}
          animate={{ opacity: reduced ? 1 : [0, 1, 0] }}
          transition={{ duration: reduced ? 0 : 0.6, ease: pageEaseOut }}
        />
      ) : null}
      {children}
    </motion.li>
  );
}

export function MomentFeedList({
  moments,
  knownLikedMomentIds,
  targetId,
  onDeleted,
}: {
  moments: MomentResponse[];
  knownLikedMomentIds?: number[];
  targetId?: number | null;
  onDeleted?: (id: number) => void;
}) {
  const { enteredMomentIds: registry } = useMomentMotion();
  const localRegistry = useMemo(() => new Set<number>(), []);
  const enteredMomentIds = registry ?? localRegistry;
  let entranceOrder = 0;

  return (
    <ol className="mx-auto w-full max-w-2xl gap-4 @min-[41rem]/moment-feed:group-data-[view=grid]/moment-feed:max-w-none @min-[41rem]/moment-feed:group-data-[view=grid]/moment-feed:columns-[20rem_4]">
      <AnimatePresence initial={false}>
        {moments.map((moment) => (
          <MomentFeedItem
            key={moment.id}
            id={moment.id}
            targeted={targetId === moment.id}
            entranceOrder={enteredMomentIds.has(moment.id) ? 0 : entranceOrder++}
            enteredMomentIds={enteredMomentIds}
          >
            <MomentCard
              moment={moment}
              knownLikedMomentIds={knownLikedMomentIds}
              mediaLayout="natural"
              onDeleted={onDeleted}
            />
          </MomentFeedItem>
        ))}
      </AnimatePresence>
    </ol>
  );
}
