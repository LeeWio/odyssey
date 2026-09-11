"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useReducedMotion } from "motion/react";
import { memo, useRef } from "react";

import { MomentCard } from "@/features/moment";
import type { MomentResponse } from "@/lib/features/moment";

gsap.registerPlugin(useGSAP);

const GAP = 20;
const FALLBACK_HEIGHT = 320;

interface MomentsMasonryProps {
  moments: MomentResponse[];
}

function getColumns(width: number) {
  if (width >= 1100) return 4;
  if (width >= 760) return 3;
  if (width >= 500) return 2;
  return 1;
}

export const MomentsMasonry = memo(function MomentsMasonry({ moments }: MomentsMasonryProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const scopeRef = useRef<HTMLDivElement>(null);
  const revealedIds = useRef(new Set<number>());

  useGSAP(
    (_context, contextSafe) => {
      const container = scopeRef.current;
      if (!container || !contextSafe) return;

      const items = Array.from(container.querySelectorAll<HTMLDivElement>("[data-moment-id]")).map(
        (node) => ({
          id: Number(node.dataset.momentId),
          node,
          content: node.firstElementChild as HTMLDivElement,
        })
      );
      const currentIds = new Set(items.map(({ id }) => id));
      revealedIds.current.forEach((id) => {
        if (!currentIds.has(id)) revealedIds.current.delete(id);
      });

      // Positioning belongs to the outer node; only the inner node animates.
      // Measuring it with offsetHeight excludes reveal/hover transforms.
      items.forEach(({ id, node, content }) => {
        const visible = shouldReduceMotion || revealedIds.current.has(id);
        node.inert = !visible;
        gsap.set(content, { opacity: visible ? 1 : 0, y: visible ? 0 : window.innerHeight + 160 });
      });

      const revealObserver = new IntersectionObserver(
        contextSafe((entries: IntersectionObserverEntry[]) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;

          const entering = items.filter(({ id }) => !revealedIds.current.has(id));
          entering.forEach(({ id, node }) => {
            revealedIds.current.add(id);
            node.inert = false;
          });
          revealObserver.unobserve(container);
          gsap.to(
            entering.map(({ content }) => content),
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.045,
              willChange: "transform,opacity",
              overwrite: "auto",
              onComplete: () => {
                entering.forEach(({ content }) => {
                  content.style.willChange = "auto";
                });
              },
            }
          );
        }),
        { threshold: 0, rootMargin: "0px 0px -24px 0px" }
      );

      let frame: number | null = null;
      let layoutWidth = 0;
      let observedWidth = 0;
      let observingReveals = false;

      const scheduleLayout = () => {
        if (frame === null) frame = requestAnimationFrame(layout);
      };

      const layout = () => {
        frame = null;
        const width = container.clientWidth;
        if (width <= 0) return;
        const columns = getColumns(width);
        const columnWidth = (width - GAP * (columns - 1)) / columns;

        if (layoutWidth !== width) {
          layoutWidth = width;
          container.style.setProperty("--moment-width", `${columnWidth}px`);
          // Give the browser a layout pass at the final card width before reading heights.
          scheduleLayout();
          return;
        }

        // Batch all reads before any writes. Content/font/widget changes are measured
        // here too, without putting heights into React state or rendering the editors again.
        const heights = items.map(({ content }) => content.offsetHeight);
        const columnHeights = new Array<number>(columns).fill(0);
        items.forEach(({ node }, index) => {
          const column = columnHeights.indexOf(Math.min(...columnHeights));
          const x = column * (columnWidth + GAP);
          const y = columnHeights[column];
          node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          columnHeights[column] += heights[index] + GAP;
        });
        container.style.height = `${Math.max(0, Math.max(...columnHeights) - GAP)}px`;

        // Observe the final positions, never a temporary stack at the origin.
        if (!observingReveals) {
          observingReveals = true;
          if (!shouldReduceMotion && items.some(({ id }) => !revealedIds.current.has(id))) {
            revealObserver.observe(container);
          }
        }
      };

      const sizeObserver = new ResizeObserver((entries) => {
        let needsLayout = false;
        entries.forEach((entry) => {
          if (entry.target !== container) {
            needsLayout = true;
          } else if (entry.contentRect.width !== observedWidth) {
            observedWidth = entry.contentRect.width;
            needsLayout = true;
          }
        });
        if (needsLayout) scheduleLayout();
      });
      sizeObserver.observe(container);
      items.forEach(({ content }) => sizeObserver.observe(content));
      scheduleLayout();

      return () => {
        if (frame !== null) cancelAnimationFrame(frame);
        sizeObserver.disconnect();
        revealObserver.disconnect();
      };
    },
    { dependencies: [moments, shouldReduceMotion], scope: scopeRef, revertOnUpdate: true }
  );

  return (
    <div ref={scopeRef} className="relative w-full" style={{ height: FALLBACK_HEIGHT }}>
      <div
        aria-hidden="true"
        className="from-background via-background/70 pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b to-transparent"
      />
      <div
        aria-hidden="true"
        className="from-background via-background/70 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t to-transparent"
      />
      {moments.map((moment) => (
        <div
          key={moment.id}
          data-moment-id={moment.id}
          className="absolute top-0 left-0 w-[var(--moment-width,100%)]"
        >
          <div className="w-full min-w-0" style={{ opacity: 0 }}>
            <div className="w-full transition-transform duration-300 ease-out hover:scale-[0.985] motion-reduce:transition-none motion-reduce:hover:scale-100">
              <MomentCard moment={moment} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
