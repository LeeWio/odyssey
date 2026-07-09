"use client";

import { Sheet } from "@heroui-pro/react";
import { useHotkeys } from "@mantine/hooks";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { selectIsSheetOpen, toggleSheet } from "@/lib/features/ui";
import { Stocks } from "./widgets/stocks";
import { useThemeSwitch } from "../theme-switch";
import { Card, Chip, Toolbar, Typography } from "@heroui/react";
import { useState } from "react";
import { useRealTime } from "@/hooks/use-real-time";
import { AnimatedNumber } from "../ui/animated-number";
import { SunMaxFillIcon } from "../icons";
import { MusicMiniWidget } from "../blog";

export function SheetPanel() {
  const isOpen = useAppSelector(selectIsSheetOpen);
  const dispatch = useAppDispatch();

  const { ModeSwitch, VariantSwitch } = useThemeSwitch();
  const { formattedDate, day, weekdayName, hours, minutes } = useRealTime();

  const [weather] = useState({ tempMin: 10, tempMax: 30 });

  useHotkeys(
    [
      [
        "mod+j",
        () => {
          dispatch(toggleSheet());
        },
      ],
    ],
    [],
    true
  );

  return (
    <Sheet isOpen={isOpen} onOpenChange={() => dispatch(toggleSheet())} isDetached placement="top">
      <Sheet.Backdrop variant="blur">
        <Sheet.Content>
          <Sheet.Dialog>
            <Sheet.Header className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stocks />
            </Sheet.Header>
            <Sheet.Body className="flex gap-4">
              <Card className="max-w-80">
                <Card.Header className="flex items-center justify-center">
                  <Chip variant="primary" color="success" size="lg">
                    {formattedDate}
                  </Chip>
                </Card.Header>

                <Card.Content className="flex flex-row items-center justify-center">
                  <AnimatedNumber
                    value={parseInt(hours)}
                    className="text-muted text-[6rem] leading-none font-bold tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                  <span className="text-accent relative top-[-0.06em] text-[6rem] leading-none font-bold tabular-nums">
                    :
                  </span>
                  <AnimatedNumber
                    value={parseInt(minutes)}
                    className="text-warning text-[6rem] leading-none font-bold tabular-nums"
                    format={{ minimumIntegerDigits: 2 }}
                  />
                </Card.Content>

                <Card.Footer className="flex items-center justify-center gap-2">
                  <SunMaxFillIcon className="text-warning-hover size-7" />
                  <Typography className="text-2xl font-bold tracking-tight">
                    {weather.tempMin}-{weather.tempMax}°
                  </Typography>
                </Card.Footer>
              </Card>
              <MusicMiniWidget
                title="Realize"
                artist="Yanzi Sun"
                cover="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=60"
                onPlayChange={(playing) => console.log(playing)}
              />
            </Sheet.Body>
            <Sheet.Footer className="flex! flex-row! flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <VariantSwitch />
                <ModeSwitch />
              </div>
              <Toolbar
                isAttached
                className="bg-danger shadow-danger/20 flex aspect-square size-20 cursor-default flex-col items-center justify-center rounded-[2.2rem] border-none p-0 text-white shadow-2xl transition-transform select-none hover:scale-105 active:scale-95"
              >
                <Typography className="text-3xl leading-none font-black tabular-nums">
                  {day}
                </Typography>
                <Typography className="mt-1 text-[10px] font-black tracking-[0.2em] text-white/80 uppercase">
                  {weekdayName}
                </Typography>
              </Toolbar>
            </Sheet.Footer>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}
