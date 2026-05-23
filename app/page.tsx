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
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0b] p-6 selection:bg-success/30">
      <Card className="w-full max-w-[380px] bg-[#1c1c1e] border-none shadow-none rounded-[3.5rem] p-10 flex flex-col items-center gap-6 overflow-hidden">
        
        {/* Date Chip */}
        <Card.Header className="p-0 flex justify-center">
          <Chip 
            variant="solid" 
            color="success" 
            size="lg"
            className="px-4 py-1.5 h-auto text-sm font-semibold text-[#1c1c1e] rounded-2xl bg-[#a3e635]"
          >
            {formattedDate}
          </Chip>
        </Card.Header>

        {/* Time Display */}
        <Card.Content className="p-0 py-4 flex justify-center w-full">
          <Typography 
            className="text-white text-[7.5rem] font-bold tracking-tighter leading-[0.8] flex items-center tabular-nums"
          >
            <AnimatedNumber 
              value={parseInt(hours)} 
              format={{ minimumIntegerDigits: 2 }}
            />
            <span className="relative -top-[0.06em] text-[#fdba74]/80 mx-1">:</span>
            <AnimatedNumber 
              value={parseInt(minutes)} 
              className="text-[#fdba74]"
              format={{ minimumIntegerDigits: 2 }}
            />
          </Typography>
        </Card.Content>

        {/* Weather/Temperature */}
        <Card.Footer className="p-0 flex justify-center items-center gap-2.5">
          <Sun className="text-[#facc15] size-7" />
          <Typography 
            className="text-white text-2xl font-bold tracking-tight"
          >
            10-30°
          </Typography>
        </Card.Footer>

      </Card>
    </main>
  );
}
