import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MomentCard } from "@/features/moment/components/card/moment-card";
import type { MomentResponse, MomentImageResponse } from "@/lib/features/moment";

gsap.registerPlugin(useGSAP);

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    return values[queries.findIndex((q) => matchMedia(q).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get);
    queries.forEach((q) => matchMedia(q).addEventListener("change", handler));
    return () => queries.forEach((q) => matchMedia(q).removeEventListener("change", handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

// Optimized useMeasure utilizing requestAnimationFrame (rAF) to throttle updates
// preventing layout thrashing and aligning reflows with monitor vertical sync.
const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    let animationFrameId: number;
    const ro = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      });
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return [ref, size] as const;
};

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.src = src;
          img.onload = img.onerror = () => resolve();
        })
    )
  );
};

interface Item {
  id: string;
  moment: MomentResponse;
}

interface GridItem extends Item {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MasonryProps {
  items: Item[];
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: "bottom" | "top" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
}

const Masonry: React.FC<MasonryProps> = ({
  items,
  ease = "power3.out",
  duration = 0.6,
  stagger = 0.05,
  animateFrom = "bottom",
  scaleOnHover = true,
  hoverScale = 1.015, // Gently scale UP on hover for premium tactile feedback
}) => {
  // Mobile devices use 1 column, tablet 2, large desktop up to 4 columns
  const columns = useMedia(
    ["(min-width:1400px)", "(min-width:1024px)", "(min-width:768px)"],
    [4, 3, 2],
    1
  );

  const [containerRef, { width }] = useMeasure<HTMLDivElement>();
  const [imagesReady, setImagesReady] = useState(false);
  const hasMounted = useRef(false);
  const prevGridRef = useRef<GridItem[]>([]);

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { x: item.x, y: item.y };

    let direction = animateFrom;
    if (animateFrom === "random") {
      const dirs = ["top", "bottom", "left", "right"];
      direction = dirs[Math.floor(Math.random() * dirs.length)] as typeof animateFrom;
    }

    switch (direction) {
      case "top":
        return { x: item.x, y: -200 };
      case "bottom":
        return { x: item.x, y: window.innerHeight + 200 };
      case "left":
        return { x: -200, y: item.y };
      case "right":
        return { x: window.innerWidth + 200, y: item.y };
      case "center":
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        };
      default:
        return { x: item.x, y: item.y + 100 };
    }
  };

  // Preload all moment image assets before firing grid alignment
  useEffect(() => {
    const urls: string[] = [];
    items.forEach((i) => {
      if (i.moment?.images) {
        i.moment.images.forEach((img: MomentImageResponse) => {
          if (img.fileUrl) urls.push(img.fileUrl);
        });
      }
    });
    preloadImages(urls).then(() => setImagesReady(true));
  }, [items]);

  // High-performance real-time DOM measuring layout calculations using the useGSAP hook
  const { contextSafe } = useGSAP(
    () => {
      if (!imagesReady || !width) return;

      const runLayout = () => {
        const colHeights = new Array(columns).fill(0);
        const gap = 24; // Spacious premium gap
        const totalGaps = (columns - 1) * gap;
        const columnWidth = (width - totalGaps) / columns;

        const computedGrid = items.map((item) => {
          const element = containerRef.current?.querySelector(
            `[data-key="${item.id}"]`
          ) as HTMLElement;
          const innerCard = element?.firstElementChild as HTMLElement;

          // Measure real fractional height using getBoundingClientRect() to avoid rounding overlap errors
          const actualHeight = innerCard ? innerCard.getBoundingClientRect().height : 320;

          // Detect if this card has more than 3 images (using stack.tsx) and should span 2 columns
          const spansTwoColumns =
            columns > 1 && item.moment.images && item.moment.images.length > 3;

          let col = 0;
          let x = 0;
          let y = 0;
          let itemWidth = columnWidth;

          if (spansTwoColumns) {
            // Find the adjacent pair of columns (col, col+1) with the shortest maximum height
            let minMaxHeight = Infinity;
            let targetCol = 0;

            for (let c = 0; c < columns - 1; c++) {
              const currentMax = Math.max(colHeights[c], colHeights[c + 1]);
              if (currentMax < minMaxHeight) {
                minMaxHeight = currentMax;
                targetCol = c;
              }
            }

            col = targetCol;
            x = col * (columnWidth + gap);
            y = minMaxHeight;
            itemWidth = 2 * columnWidth + gap;

            // Update heights of both columns
            colHeights[col] = y + actualHeight + gap;
            colHeights[col + 1] = y + actualHeight + gap;
          } else {
            // Standard single column placement
            col = colHeights.indexOf(Math.min(...colHeights));
            x = col * (columnWidth + gap);
            y = colHeights[col];
            itemWidth = columnWidth;

            colHeights[col] += actualHeight + gap;
          }

          return {
            ...item,
            x,
            y,
            w: itemWidth,
            h: actualHeight,
          };
        });

        // Check if layout has actually changed before running any animations or updating DOM styles.
        // This prevents redundant ResizeObserver initial fires from canceling ongoing staggered entry animations.
        const isLayoutIdentical = () => {
          const oldGrid = prevGridRef.current;
          if (oldGrid.length !== computedGrid.length) return false;
          for (let i = 0; i < computedGrid.length; i++) {
            const n = computedGrid[i];
            const o = oldGrid[i];
            if (
              n.id !== o.id ||
              Math.abs(n.x - o.x) > 0.1 ||
              Math.abs(n.y - o.y) > 0.1 ||
              Math.abs(n.w - o.w) > 0.1 ||
              Math.abs(n.h - o.h) > 0.1
            ) {
              return false;
            }
          }
          return true;
        };

        if (hasMounted.current && isLayoutIdentical()) {
          return;
        }

        // Cache the latest layout grid
        prevGridRef.current = computedGrid;

        // Stretch parent container style height to match the tallest column perfectly
        if (containerRef.current) {
          containerRef.current.style.height = `${Math.max(...colHeights)}px`;
        }

        // Animate positions cleanly.
        // DO NOT animate 'width' or 'height' with GSAP to avoid layout thrashing and infinite ResizeObserver loop feedback!
        // The container width is already set instantly by React's style, so the card naturally reflows and calculates the correct height.
        computedGrid.forEach((item, index) => {
          const selector = `[data-key="${item.id}"]`;
          const animProps = { x: item.x, y: item.y };

          if (!hasMounted.current) {
            const start = getInitialPosition(item);
            gsap.fromTo(
              selector,
              {
                opacity: 0,
                x: start.x,
                y: start.y,
                filter: "blur(8px)",
              },
              {
                opacity: 1,
                ...animProps,
                filter: "blur(0px)",
                duration: 0.8,
                ease: "power3.out",
                delay: index * stagger,
              }
            );
          } else {
            // Absolute zero flashing: GSAP gracefully transitions inline styles smoothly from their CURRENT properties during resizes!
            gsap.to(selector, {
              ...animProps,
              duration: duration,
              ease: ease,
              overwrite: "auto",
            });
          }
        });

        hasMounted.current = true;
      };

      // Run initial layout
      runLayout();

      // Set up ResizeObserver to observe when inner card height changes (e.g. image loads, text reflow, comments toggled)
      // Throttled with requestAnimationFrame to prevent layout thrashing and align reflows with monitor refresh rate.
      let rAFId: number;
      const resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(rAFId);
        rAFId = requestAnimationFrame(() => {
          runLayout();
        });
      });

      // Observe each card's inner element
      const innerCards = containerRef.current?.querySelectorAll("[data-key] > div");
      innerCards?.forEach((card) => resizeObserver.observe(card));

      return () => {
        resizeObserver.disconnect();
        cancelAnimationFrame(rAFId);
      };
    },
    {
      dependencies: [width, items, imagesReady, columns],
      scope: containerRef,
    }
  );

  const handleMouseEnter = contextSafe((id: string) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  });

  const handleMouseLeave = contextSafe((id: string) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  });

  return (
    <div ref={containerRef} className="relative h-full min-h-[500px] w-full">
      {items.map((item) => {
        // Fallback calculations for the initial first paint
        const gap = 24;
        const totalGaps = (columns - 1) * gap;
        const columnWidth = width ? (width - totalGaps) / columns : 280;

        // Determine if the card is wide (spans 2 columns) based on columns and image count
        const isWide = columns > 1 && item.moment.images && item.moment.images.length > 3;
        const cardWidth = isWide ? 2 * columnWidth + gap : columnWidth;

        return (
          <div
            key={item.id}
            data-key={item.id}
            className="absolute box-content"
            style={{
              width: cardWidth,
              willChange: "transform, opacity",
              opacity: imagesReady ? 1 : 0, // Prevent flash of raw layout before measuring
            }}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={() => handleMouseLeave(item.id)}
          >
            <div className="relative h-auto w-full">
              <MomentCard moment={item.moment} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Masonry;
