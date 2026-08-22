import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MomentCard } from "@/features/moment/components/card/moment-card";
import type { MomentResponse, MomentImageResponse } from "@/lib/features/moment";

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

  // Persistent GSAP Context reference to ensure garbage collection ONLY on component unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctxRef = useRef<any>(null);

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

  // Cleanly dispose and revert all active GSAP animations ONLY when the component completely unmounts!
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.revert();
      }
    };
  }, []);

  // High-performance real-time DOM measuring layout calculations
  useLayoutEffect(() => {
    if (!imagesReady || !width) return;

    // Encapsulate layout packing and GSAP flight tweens into a reusable reflow function
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

        // Measure real offsetHeight, fallback to a standard card height approximation
        const actualHeight = innerCard ? innerCard.offsetHeight : 320;

        // Classically distribute items dynamically into the currently shortest column (Greedy Packing Algorithm)
        const col = colHeights.indexOf(Math.min(...colHeights));
        const x = col * (columnWidth + gap);
        const y = colHeights[col];

        // Update single column height
        colHeights[col] += actualHeight + gap;

        return {
          ...item,
          x,
          y,
          w: columnWidth,
          h: actualHeight,
        };
      });

      // Stretch parent container style height to match the tallest column perfectly
      if (containerRef.current) {
        containerRef.current.style.height = `${Math.max(...colHeights)}px`;
      }

      // Wrap GSAP animations in a clean GSAP Context and store reference without rendering-revert!
      const ctx = gsap.context(() => {
        computedGrid.forEach((item, index) => {
          const selector = `[data-key="${item.id}"]`;
          const animProps = { x: item.x, y: item.y, width: item.w };

          if (!hasMounted.current) {
            const start = getInitialPosition(item);
            gsap.fromTo(
              selector,
              {
                opacity: 0,
                x: start.x,
                y: start.y,
                width: item.w,
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
      }, containerRef);

      hasMounted.current = true;
      ctxRef.current = ctx; // Update active context reference
    };

    // Run the initial layout calculation
    runLayout();

    // Dynamically observe ONLY the inner card elements ([data-key] > div)
    // This catches dynamic image loads, skeleton-to-chart swaps, text expansion, etc.
    // while perfectly avoiding loop-back triggers from our wrapper size writes!
    const resizeObserver = new ResizeObserver(() => {
      runLayout();
    });

    // Observe each card's inner element
    const innerCards = containerRef.current?.querySelectorAll("[data-key] > div");
    innerCards?.forEach((card) => resizeObserver.observe(card));

    // Clean up observer on re-layout or unmount
    return () => {
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, items, imagesReady, columns]);

  const handleMouseEnter = (id: string) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: hoverScale,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = (id: string) => {
    if (scaleOnHover) {
      gsap.to(`[data-key="${id}"]`, {
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  return (
    <div ref={containerRef} className="relative h-full min-h-[500px] w-full">
      {items.map((item) => {
        // Fallback calculations for the initial first paint
        const gap = 24;
        const totalGaps = (columns - 1) * gap;
        const columnWidth = width ? (width - totalGaps) / columns : 280;

        return (
          <div
            key={item.id}
            data-key={item.id}
            className="absolute box-content"
            style={{
              width: columnWidth,
              willChange: "transform, width, height, opacity",
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
