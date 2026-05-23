"use client";

import { Card, Chip, Typography } from "@heroui/react";
import { useMounted } from "@/hooks/use-mounted";
import { Sun } from "@gravity-ui/icons";

export default function Home() {
  const mounted = useMounted();

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
            Sat, 5/23
          </Chip>
        </Card.Header>

        {/* Time Display */}
        <Card.Content className="p-0 py-4 flex justify-center w-full">
          <Typography 
            className="text-white text-[7.5rem] font-bold tracking-tighter leading-[0.8] flex items-center tabular-nums"
          >
            <span>12</span>
            <span className="relative -top-[0.06em] text-[#fdba74]/80 mx-1">:</span>
            <span className="text-[#fdba74]">11</span>
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
