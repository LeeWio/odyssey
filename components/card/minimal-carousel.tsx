"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MoreHorizontal, Copy } from "lucide-react";
import { Button, Card } from "@heroui/react";
import { MotionButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

/* --- Types --- */
interface CarouselIconProps {
  size?: number | string;
  className?: string;
}

export interface CarouselCard {
  id: string;
  title: string;
  value: string;
  compactValue?: string;
  color?: "default" | "accent" | "success" | "warning" | "danger";
  icon: React.ComponentType<CarouselIconProps>;
}

const cardColorClasses = {
  default: "bg-default text-default-foreground",
  accent: "bg-accent text-accent-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
} as const;

interface MinimalCarouselProps {
  cards: CarouselCard[];
  onCopyClick?: (card: CarouselCard) => void;
  onCustomizeClick?: (card: CarouselCard) => void;
  copyLabel?: string;
  actionLabel?: string;
}

export const MinimalCarousel: React.FC<MinimalCarouselProps> = ({
  cards,
  onCopyClick,
  onCustomizeClick,
  copyLabel = "Copy Address",
  actionLabel = "Edit",
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCard = cards.find((c) => c.id === activeId);
  const secondaryCards = cards.filter((c) => c.id !== activeId);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setActiveId(null);
  };

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-transparent">
      <div
        className="flex w-full flex-col items-center justify-center px-3 font-sans select-none sm:px-4"
        onClick={handleBackgroundClick}
      >
        {/* Container  */}
        <div className="w-full max-w-105">
          <motion.div layout className="flex flex-col gap-3">
            {/* Expanded Card */}
            <AnimatePresence mode="popLayout">
              {activeCard && (
                <motion.div
                  key={activeCard.id}
                  layoutId={activeCard.id}
                  className="min-h-42.5 w-full sm:h-48"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                >
                  <Card
                    className={cn(
                      "h-full justify-between",
                      cardColorClasses[activeCard.color ?? "default"]
                    )}
                  >
                    <Card.Header className="flex-row items-start justify-between">
                      <activeCard.icon size={38} />

                      <MotionButton
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        size="sm"
                        variant="tertiary"
                        onPress={() => onCopyClick?.(activeCard)}
                      >
                        {copyLabel} <Copy size={16} />
                      </MotionButton>
                    </Card.Header>

                    <Card.Footer className="justify-between">
                      <div>
                        <Card.Title className="text-inherit">{activeCard.title}</Card.Title>
                        <Card.Description className="text-inherit">
                          {activeCard.value}
                        </Card.Description>
                      </div>

                      <Button
                        isIconOnly
                        aria-label={actionLabel}
                        size="sm"
                        variant="primary"
                        onPress={() => onCustomizeClick?.(activeCard)}
                      >
                        <Icon icon="gravity-ui:paper-plane" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className={`grid gap-2 transition-all duration-500 sm:gap-3 ${
                activeId ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
              {(activeId ? secondaryCards : cards).map((card) => (
                <motion.div
                  key={card.id}
                  layoutId={card.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveId(card.id);
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  className={`cursor-pointer ${activeId ? "h-36 sm:h-32" : "h-28 sm:h-32"}`}
                >
                  <Card
                    className={cn(
                      "h-full justify-between",
                      cardColorClasses[card.color ?? "default"]
                    )}
                  >
                    <Card.Header className="flex-row items-start justify-between">
                      <card.icon size={activeId ? 20 : 28} />
                      <MoreHorizontal size={16} />
                    </Card.Header>

                    <Card.Footer>
                      <div>
                        <Card.Title className="text-inherit">{card.title}</Card.Title>
                        <Card.Description className="text-inherit">
                          {card.compactValue ?? card.value}
                        </Card.Description>
                      </div>
                    </Card.Footer>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
