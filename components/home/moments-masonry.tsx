"use client";

import { useElementSize } from "@mantine/hooks";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";

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

function MeasuredMoment({ moment, onHeightChange }: MeasuredMomentProps) {
  const { ref, height } = useElementSize<HTMLDivElement>();

  useEffect(() => {
    if (height > 0) onHeightChange(moment.id, height);
  }, [height, moment.id, onHeightChange]);

  return (
    <div ref={ref} className="w-full min-w-0">
      <MomentCard moment={moment} />
    </div>
  );
}

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
  const hasAnimated = useRef(false);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());
  const { ref: measureRef, width } = useElementSize<HTMLDivElement>();

  const onHeightChange = useCallback((id: number, height: number) => {
    setMeasuredHeights((current) => {
      if (current.get(id) === height) return current;
      const next = new Map(current);
      next.set(id, height);
      return next;
    });
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
      const nodes = positionedNodes.map(({ node }) => node);

      if (nodes.length === 0) return;

      const targetX = (index: number) => positionedNodes[index]?.item.x ?? 0;
      const targetY = (index: number) => positionedNodes[index]?.item.y ?? 0;

      if (shouldReduceMotion) {
        gsap.set(nodes, {
          opacity: 1,
          x: targetX,
          y: targetY,
          clearProps: "filter",
        });
        hasAnimated.current = true;
        return;
      }

      if (!hasAnimated.current) {
        gsap.fromTo(
          nodes,
          {
            opacity: 0,
            x: targetX,
            y: () => window.innerHeight + 160,
            filter: "blur(12px)",
          },
          {
            opacity: 1,
            x: targetX,
            y: targetY,
            filter: "blur(0px)",
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
                willChange: "transform, opacity",
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
