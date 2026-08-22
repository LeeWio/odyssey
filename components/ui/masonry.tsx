import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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

// Helper to dynamically estimate a Moment's height for optimal column-height balancing (greedy packing)
const estimateMomentHeight = (moment: MomentResponse) => {
  let height = 180; // Base card container (header, footer, padding margins)

  // 1. Text height
  if (moment.content) {
    const len = moment.content.length;
    if (len > 1500) height += 180;
    else if (len > 800) height += 120;
    else if (len > 300) height += 70;
    else height += 35;
  }

  // 2. Image gallery matching card's dynamic size
  const imageCount = moment.images?.length || 0;
  if (imageCount > 0) {
    let galleryHeight = 108;
    if (imageCount === 1) galleryHeight = 240;
    else if (imageCount === 2) galleryHeight = 140;
    else if (imageCount === 3) galleryHeight = 120;
    else if (imageCount === 4) galleryHeight = 110;
    height += galleryHeight + 16;
  }

  // 3. Stock trend widget
  if (moment.stockSymbol) {
    height += 150;
  }

  // 4. Topic Tags
  if (moment.topics && moment.topics.length > 0) {
    height += 36;
  }

  return height;
};

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  // Breakpoints mapping to column count (Strictly 1 column for all mobile devices under 768px for readable layout)
  const columns = useMedia(
    ["(min-width:1400px)", "(min-width:1024px)", "(min-width:768px)"],
    [4, 3, 2],
    1
  );

  // Distribute items dynamically into the currently shortest column (Greedy Packing Algorithm)
  // This guarantees organic row-level staggering and balanced bottom columns!
  const columnsData = useMemo(() => {
    const cols = Array.from({ length: columns }, () => [] as Item[]);
    const colHeights = new Array(columns).fill(0);

    items.forEach((item) => {
      const shortestColIndex = colHeights.indexOf(Math.min(...colHeights));
      cols[shortestColIndex].push(item);

      const itemHeight = estimateMomentHeight(item.moment);
      colHeights[shortestColIndex] += itemHeight;
    });

    return cols;
  }, [items, columns]);

  return (
    <div className="flex w-full items-start gap-4 md:gap-6">
      <AnimatePresence mode="popLayout">
        {columnsData.map((columnItems, colIndex) => (
          <div key={colIndex} className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
            {columnItems.map((item) => (
              <motion.div
                key={item.id}
                layout // Magical layout layout-tweening FLIP animation
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
