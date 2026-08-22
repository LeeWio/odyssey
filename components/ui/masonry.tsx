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

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  // Breakpoints mapping to column count
  const columns = useMedia(
    ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"],
    [4, 3, 2, 2],
    1
  );

  // Distribute items sequentially into column tracks to prevent overlapping completely
  const columnsData = useMemo(() => {
    const cols = Array.from({ length: columns }, () => [] as Item[]);
    items.forEach((item, index) => {
      cols[index % columns].push(item);
    });
    return cols;
  }, [items, columns]);

  return (
    <div className="flex w-full items-start gap-6">
      <AnimatePresence mode="popLayout">
        {columnsData.map((columnItems, colIndex) => (
          <div key={colIndex} className="flex min-w-0 flex-1 flex-col gap-6">
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
