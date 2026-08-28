"use client";

import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useMemo, useState } from "react";
import { MomentCard } from "@/features/moment/components/card/moment-card";
import type { MomentResponse } from "@/lib/features/moment";

interface Item {
  id: string;
  moment: MomentResponse;
}

interface MasonryProps {
  items: Item[];
}

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const get = () => {
    if (typeof window === "undefined") return defaultValue;
    return values[queries.findIndex((query) => matchMedia(query).matches)] ?? defaultValue;
  };

  const [value, setValue] = useState<number>(get);

  useEffect(() => {
    const handler = () => setValue(get());
    queries.forEach((query) => matchMedia(query).addEventListener("change", handler));

    return () =>
      queries.forEach((query) => matchMedia(query).removeEventListener("change", handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queries]);

  return value;
};

// Keep the distribution stable before images and rich text finish measuring. The actual cards
// can still have different heights; this estimate only decides which column receives each card.
const estimateMomentHeight = (moment: MomentResponse) => {
  let height = 180;
  const contentLength =
    typeof moment.content === "string"
      ? moment.content.length
      : JSON.stringify(moment.content ?? "").length;

  if (contentLength > 1500) height += 180;
  else if (contentLength > 800) height += 120;
  else if (contentLength > 300) height += 70;
  else if (contentLength > 0) height += 35;

  const imageCount = moment.images?.length ?? 0;
  if (imageCount === 1) height += 256;
  else if (imageCount === 2) height += 156;
  else if (imageCount === 3) height += 136;
  else if (imageCount > 3) height += 124;

  if (moment.stockSymbol) height += 150;
  if (moment.topics?.length) height += 36;

  return height;
};

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  const columns = useMedia(
    ["(min-width:1400px)", "(min-width:1024px)", "(min-width:768px)"],
    [4, 3, 2],
    1
  );

  const columnsData = useMemo(() => {
    const nextColumns = Array.from({ length: columns }, () => [] as Item[]);
    const columnHeights = new Array(columns).fill(0);

    items.forEach((item) => {
      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
      nextColumns[shortestColumn].push(item);
      columnHeights[shortestColumn] += estimateMomentHeight(item.moment);
    });

    return nextColumns;
  }, [items, columns]);

  return (
    <div className="flex w-full items-start gap-4 md:gap-6">
      <AnimatePresence mode="popLayout">
        {columnsData.map((columnItems, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
            {columnItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  layout: { duration: 0.45, ease: "easeInOut" },
                }}
                className="w-full origin-center"
              >
                <MomentCard moment={item.moment} />
              </motion.div>
            ))}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Masonry;
