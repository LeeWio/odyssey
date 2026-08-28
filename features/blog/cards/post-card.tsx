"use client";

import { Calendar, Person } from "@gravity-ui/icons";
import { Chip, Surface, Typography, cn } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import Grainient from "@/components/background/grainient";

export type PostCardVariant = "default" | "gradient-header" | "full-gradient";

interface PostCardProps {
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  href: string;
  coverImage?: string;
  className?: string;
  variant?: PostCardVariant;
  gradient?: string; // e.g. "from-purple-500 to-blue-500"
}

function getGrainientProps(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash = hash >>> 0;

  const warpStrength = 0.5 + ((hash % 10) / 10) * 1.5;
  const warpFrequency = 3.0 + ((hash % 13) / 13) * 6.0;
  const warpSpeed = 1.0 + ((hash % 7) / 7) * 2.0;
  const blendAngle = hash % 360;
  const rotationAmount = 200.0 + ((hash % 15) / 15) * 600.0;
  const zoom = 0.6 + ((hash % 8) / 8) * 0.6;

  return {
    warpStrength,
    warpFrequency,
    warpSpeed,
    blendAngle,
    rotationAmount,
    zoom,
    grainAmount: 0,
    timeSpeed: 0.12,
  };
}

export const PostCard = ({
  title,
  description,
  date,
  author,
  category,
  href,
  coverImage,
  className,
  variant = "default",
  gradient = "from-zinc-500 to-zinc-800",
}: PostCardProps) => {
  const content = (
    <Surface
      variant={variant === "default" ? "default" : "transparent"}
      className={cn(
        "flex h-full flex-col overflow-hidden border-none p-0 transition-all duration-300",
        variant === "default" && "hover:shadow-xl dark:hover:shadow-zinc-950/50",
        variant === "gradient-header" && "bg-background shadow-sm hover:shadow-md",
        variant === "full-gradient" && cn("bg-gradient-to-br text-white shadow-lg", gradient),
        className
      )}
    >
      {/* Variant: Gradient Header */}
      {variant === "gradient-header" && (
        <div
          className={cn(
            "relative aspect-square w-full bg-gradient-to-br sm:aspect-[4/3]",
            gradient
          )}
        >
          {coverImage && (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover opacity-60 mix-blend-overlay transition-transform duration-500 group-hover:scale-110"
            />
          )}
        </div>
      )}

      {/* Variant: Default (Existing) */}
      {variant === "default" && (
        <div className="bg-surface-secondary relative aspect-video w-full overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center">
              <Grainient {...getGrainientProps(title)} className="absolute inset-0" />
              <Typography className="relative z-10 text-sm font-medium text-white/50 italic select-none">
                Chronicle
              </Typography>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Chip
              size="sm"
              variant="soft"
              className="border-none bg-zinc-900/40 text-white backdrop-blur-md"
            >
              {category}
            </Chip>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn("flex flex-1 flex-col", variant === "full-gradient" ? "p-8" : "p-6")}>
        {variant === "gradient-header" && (
          <div className="mb-4">
            <Chip size="sm" variant="soft" color="accent" className="font-bold">
              {category}
            </Chip>
          </div>
        )}

        <Typography
          className={cn(
            "mb-2 line-clamp-2 leading-tight tracking-tight transition-colors",
            variant === "full-gradient"
              ? "text-2xl font-black text-white"
              : "text-foreground group-hover:text-primary text-xl font-bold",
            variant === "gradient-header" && "text-lg"
          )}
        >
          {title}
        </Typography>

        <Typography
          className={cn(
            "line-clamp-2 text-sm leading-relaxed",
            variant === "full-gradient" ? "text-white/80" : "text-default-500"
          )}
        >
          {description}
        </Typography>

        <div
          className={cn(
            "mt-auto flex items-center justify-between pt-6",
            variant !== "full-gradient" && "border-default-100 border-t",
            variant === "full-gradient" && "text-white/60"
          )}
        >
          <div className="flex items-center gap-2">
            {variant !== "full-gradient" && (
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                <Person className="text-primary size-3.5" />
              </div>
            )}
            <Typography
              className={cn(
                "text-xs font-medium",
                variant === "full-gradient" ? "text-white/80" : "text-default-600"
              )}
            >
              {author}
            </Typography>
          </div>

          <div className="flex items-center gap-1.5 opacity-60">
            <Calendar className="size-3.5" />
            <Typography className="text-[10px] font-bold tracking-widest uppercase tabular-nums">
              {date}
            </Typography>
          </div>
        </div>
      </div>
    </Surface>
  );

  return (
    <div className={cn("h-full", className)}>
      <Link href={href} className="group block h-full" prefetch={false}>
        {content}
      </Link>
    </div>
  );
};
