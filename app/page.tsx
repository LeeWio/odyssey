"use client";

import { Card, Chip, Typography, Avatar } from "@heroui/react";
import { useMounted } from "@/hooks/use-mounted";
import { useRealTime } from "@/hooks/use-real-time";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

export default function Home() {
  const mounted = useMounted();
  const { formattedDate, hours, minutes } = useRealTime();
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  // Music disk rotation animation
  useGSAP(
    () => {
      if (!mounted) return;

      gsap.to(".music-disk", {
        rotation: 360,
        duration: 10,
        repeat: -1,
        ease: "none",
      });
    },
    { scope: avatarContainerRef, dependencies: [mounted] }
  );

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 p-6"></main>
  );
}
