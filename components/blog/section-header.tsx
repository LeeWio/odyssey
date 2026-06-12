"use client";

import { Typography, Separator } from "@heroui/react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  align?: "start" | "center";
}

export const SectionHeader = ({ title, description, align = "start" }: SectionHeaderProps) => {
  const isCentered = align === "center";

  return (
    <div className={`flex flex-col gap-4 ${isCentered ? "items-center text-center" : "items-start text-left"}`}>
      <Typography 
        type="body-xs" 
        color="muted" 
        className="font-mono tracking-[0.3em] uppercase opacity-50"
      >
        — Volume I / The Journal
      </Typography>
      <Typography 
        type="h1" 
        weight="bold" 
        className="text-5xl tracking-tighter sm:text-7xl"
      >
        {title}
      </Typography>
      {description && (
        <Typography 
          type="body" 
          color="muted" 
          className="max-w-md text-base font-normal leading-relaxed opacity-60 sm:text-lg"
        >
          {description}
        </Typography>
      )}
    </div>
  );
};
