import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MomentCard } from "@/features/moment/components/card/moment-card";
import type { MomentResponse } from "@/lib/features/moment";
import { useMediaQuery } from "@mantine/hooks";

interface Item {
  id: string;
  moment: MomentResponse;
}

interface MasonryProps {
  items: Item[];
}

// Highly artistic, editorial multi-column repeating pattern
// Row 1: 3 columns, Row 2: 2 columns (wide), Row 3: 4 columns (compact), Row 4: 3 columns...
const ROW_PATTERNS = [3, 2, 4, 3, 2];

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  // Mobile devices always stay in a single column for maximum readability
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Partition moments horizontally into staggered rows with varying column counts!
  const rowsData = useMemo(() => {
    if (isMobile) {
      // Mobile is always 1 column per row
      return items.map((item) => ({
        columnsCount: 1,
        items: [item],
      }));
    }

    const result: { columnsCount: number; items: Item[] }[] = [];
    let currentIndex = 0;
    let patternIndex = 0;

    while (currentIndex < items.length) {
      const colsCount = ROW_PATTERNS[patternIndex % ROW_PATTERNS.length];
      const slice = items.slice(currentIndex, currentIndex + colsCount);

      if (slice.length > 0) {
        result.push({
          columnsCount: slice.length,
          items: slice,
        });
      }

      currentIndex += colsCount;
      patternIndex++;
    }

    return result;
  }, [items, isMobile]);

  return (
    <div className="flex w-full flex-col gap-4 md:gap-6">
      <AnimatePresence mode="popLayout">
        {rowsData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full items-start gap-4 md:gap-6">
            {row.items.map((item) => (
              <motion.div
                key={item.id}
                layout // Magical layout FLIP animation - glides and resizes cards fluidly on key/column changes!
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 28,
                  layout: { duration: 0.45, ease: "easeInOut" },
                }}
                className="min-w-0 flex-1 origin-center"
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
