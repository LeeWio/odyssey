"use client";

import { useElementSize } from "@mantine/hooks";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MomentCard } from "@/features/moment";
import type { MomentResponse } from "@/lib/features/moment";

gsap.registerPlugin(useGSAP);

const GAP = 20;
const FALLBACK_HEIGHT = 320;
const EASE = "power3.out";

interface MomentsMasonryProps {
  moments: MomentResponse[];
}

interface GridItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MeasuredMomentProps {
  moment: MomentResponse;
  onHeightChange: (id: number, height: number) => void;
}

const MeasuredMoment = memo(function MeasuredMoment({
  moment,
  onHeightChange,
}: MeasuredMomentProps) {
  const { ref, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    if (height > 0) onHeightChange(moment.id, height);
  }, [height, moment.id, onHeightChange]);

  return (
    <div ref={ref} className="w-full min-w-0">
      <MomentCard moment={moment} />
    </div>
  );
});

function getColumns(width: number) {
  if (width >= 1100) return 4;
  if (width >= 760) return 3;
  if (width >= 500) return 2;
  return 1;
}

export function MomentsMasonry({ moments }: MomentsMasonryProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const scopeRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<number, HTMLDivElement>());
  const previousPositions = useRef(new Map<number, Pick<GridItem, "x" | "y">>());
  const pendingHeights = useRef(new Map<number, number>());
  const heightFrame = useRef<number | null>(null);
  const hasAnimated = useRef(false);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());
  const { ref: measureRef, width } = useElementSize<HTMLDivElement>();

  const flushMeasuredHeights = useCallback(() => {
    heightFrame.current = null;
    if (pendingHeights.current.size === 0) return;

    setMeasuredHeights((current) => {
      let changed = false;
      const next = new Map(current);

      pendingHeights.current.forEach((height, id) => {
        if (next.get(id) !== height) {
          next.set(id, height);
          changed = true;
        }
      });
      pendingHeights.current.clear();

      return changed ? next : current;
    });
  }, []);

  const onHeightChange = useCallback(
    (id: number, height: number) => {
      pendingHeights.current.set(id, height);
      if (heightFrame.current === null) {
        heightFrame.current = requestAnimationFrame(flushMeasuredHeights);
      }
    },
    [flushMeasuredHeights]
  );

  useEffect(() => {
    return () => {
      if (heightFrame.current !== null) cancelAnimationFrame(heightFrame.current);
    };
  }, []);

  const columns = getColumns(width);
  const allMeasured =
    moments.length > 0 && moments.every((moment) => measuredHeights.has(moment.id));

  const { grid, containerHeight } = useMemo(() => {
    if (!width || moments.length === 0) return { grid: [], containerHeight: 0 };

    const columnHeights = new Array<number>(columns).fill(0);
    const columnWidth = (width - GAP * (columns - 1)) / columns;
    const nextGrid: GridItem[] = [];

    moments.forEach((moment) => {
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const height = measuredHeights.get(moment.id) ?? FALLBACK_HEIGHT;

      nextGrid.push({
        id: moment.id,
        x: column * (columnWidth + GAP),
        y: columnHeights[column],
        width: columnWidth,
        height,
      });

      columnHeights[column] += height + GAP;
    });

    return {
      grid: nextGrid,
      containerHeight: Math.max(0, Math.max(...columnHeights) - GAP),
    };
  }, [columns, measuredHeights, moments, width]);

  useGSAP(
    () => {
      if (!allMeasured || grid.length === 0) return;

      const positionedNodes = grid
        .map((item) => ({ item, node: itemRefs.current.get(item.id) }))
        .filter((entry): entry is { item: GridItem; node: HTMLDivElement } => Boolean(entry.node));
      const nextPositions = new Map(
        positionedNodes.map(({ item }) => [item.id, { x: item.x, y: item.y }])
      );

      if (positionedNodes.length === 0) return;

      if (shouldReduceMotion) {
        const nodes = positionedNodes.map(({ node }) => node);
        gsap.set(nodes, {
          opacity: 1,
          x: (index) => positionedNodes[index]?.item.x ?? 0,
          y: (index) => positionedNodes[index]?.item.y ?? 0,
          clearProps: "filter",
        });
        previousPositions.current = nextPositions;
        hasAnimated.current = true;
        return;
      }

      const entriesToAnimate = hasAnimated.current
        ? positionedNodes.filter(({ item }) => {
            const previous = previousPositions.current.get(item.id);
            return !previous || previous.x !== item.x || previous.y !== item.y;
          })
        : positionedNodes;
      previousPositions.current = nextPositions;

      if (entriesToAnimate.length === 0) return;

      const nodes = entriesToAnimate.map(({ node }) => node);
      const targetX = (index: number) => entriesToAnimate[index]?.item.x ?? 0;
      const targetY = (index: number) => entriesToAnimate[index]?.item.y ?? 0;

      if (!hasAnimated.current) {
        gsap.fromTo(
          nodes,
          {
            opacity: 0,
            scale: 0.985,
            x: targetX,
            y: () => window.innerHeight + 160,
          },
          {
            opacity: 1,
            scale: 1,
            x: targetX,
            y: targetY,
            duration: 0.8,
            ease: EASE,
            stagger: 0.045,
            overwrite: "auto",
          }
        );
        hasAnimated.current = true;
        return;
      }

      gsap.to(nodes, {
        x: targetX,
        y: targetY,
        duration: 0.55,
        ease: EASE,
        stagger: 0.02,
        overwrite: "auto",
      });
    },
    {
      dependencies: [allMeasured, grid, shouldReduceMotion],
      scope: scopeRef,
    }
  );

  return (
    <div
      ref={scopeRef}
      className="relative w-full"
      style={{ height: containerHeight || undefined }}
    >
      <div
        aria-hidden="true"
        className="from-background via-background/70 pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background via-background/70 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t to-transparent"
      />
      <div
        ref={measureRef}
        className="relative w-full"
        style={{ height: containerHeight || undefined }}
      >
        {grid.map((item, index) => {
          const moment = moments[index];
          if (!moment) return null;

          return (
            <div
              key={item.id}
              ref={(node) => {
                if (node) itemRefs.current.set(item.id, node);
                else itemRefs.current.delete(item.id);
              }}
              className="absolute top-0 left-0 origin-center"
              style={{
                width: item.width,
                opacity: allMeasured ? undefined : 0,
                willChange: "transform",
              }}
            >
              <div className="w-full transition-transform duration-300 ease-out hover:scale-[0.985]">
                <MeasuredMoment moment={moment} onHeightChange={onHeightChange} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
