"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { useMounted } from "@/hooks/use-mounted";
import { Sun } from "@gravity-ui/icons";
import { useRealTime } from "@/hooks/use-real-time";
import { AnimatedNumber } from "@/components/ui/animated-number";

export default function Home() {
  const mounted = useMounted();
  const { formattedDate, hours, minutes } = useRealTime();

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen items-center justify-center">
      
    </main>
  );
}
