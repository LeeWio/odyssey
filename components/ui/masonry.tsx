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

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
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
  hoverScale = 0.98,
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

  // High-performance real-time DOM measuring layout calculations
  useLayoutEffect(() => {
    if (!imagesReady || !width) return;

    const colHeights = new Array(columns).fill(0);
    const gap = 24; // Spacious premium gap
    const totalGaps = (columns - 1) * gap;
    const columnWidth = (width - totalGaps) / columns;

    const computedGrid = items.map((item) => {
      const element = containerRef.current?.querySelector(`[data-key="${item.id}"]`) as HTMLElement;
      const innerCard = element?.firstElementChild as HTMLElement;

      // Measure real offsetHeight, fallback to a standard card height approximation
      const actualHeight = innerCard ? innerCard.offsetHeight : 320;

      const col = colHeights.indexOf(Math.min(...colHeights));
      const x = col * (columnWidth + gap);
      const y = colHeights[col];

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

    // Trigger premium GSAP absolute-positioning transitions!
    computedGrid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`;
      const animProps = { x: item.x, y: item.y, width: item.w, height: item.h };

      if (!hasMounted.current) {
        const start = getInitialPosition(item);
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: start.x,
            y: start.y,
            width: item.w,
            height: item.h,
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
        gsap.to(selector, {
          ...animProps,
          duration: duration,
          ease: ease,
          overwrite: "auto",
        });
      }
    });

    hasMounted.current = true;
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
